---
title: Deploying the Network File Server
series: 
  name: Deploying Kubernetes
  part: 3
tags: [deploying, kubernetes, k8s, linux, vmware, esxi, part1, post]
description: "The third article of the Deploying Kubernetes series. This article follows on the last guide, *Deploying Core Networking*, where we have our front-end, back-end & storage area networks configured."
date: 2022-10-09
author: "Martin George"
preview_image: /images/deploying-kubernetes-part-3-deploying-network-file-server/preview_image.jpg
#layout: ../../layouts/Post.astrocategory: Instructional
---
# Deploying Kubernetes Part 3 - Deploying the Network File Server

## Introduction

Welcome to the third part of our series on deploying Kubernetes. In the last guide, *Deploying Kubernetes Part 2 - Deploying Core Networking*, we set up the front-end and back-end networks for our Kubernetes cluster. In this guide, we will be setting up a network file server (NFS) for storage.

While it would be ideal to use a storage solution like rook.io in a production environment, the overhead of running three virtual machines for such a small cluster is not ideal. Single node Ceph clusters are not recommended for anything outside of testing. It makes more sense that we use something more lightweight and in-tune with what we are engineering.

When there's no ideal solution, it's always best to keep things as simple as possible. In that case, we'll use a server running NFS, exporting ZFS disks. This  allows us to directly access the data running on the NFS server remotely (It can be a little tricky to mount Ceph partitions outside of Ceph), as well as export shares for Kubernetes to use as persistent volumes.  

## SAN VM Deployment

1. Create a new virtual machine 
	1. Click *Create/Register VM*
	2. Select *Create a new virtual machine*, press next
	3. Enter the following details:
			1. **Name:** I will be using *nfs.san.dingo.services*
		1. **Compatibility:** The latest ESXI version *virtual machine*
		2. **Guest OS Familt:** *Linux*
		3. **Guest OS Version:** *Red Hat Enterprise Linux 9 (64-bit)*
	4. Select the datastore. e.g. `datastore1`
	5. Configure the VM
		1. **CPU:** The maximum the dropdown reflects.
		1. **Memory:** *16GB* 
		1. **Hard Disks:** 
			1. **First Hard Disk:** 32GB (This will be our OS, we'll use LVM as so we can extend the size later on if required)
			1. **Second Hard Disk:** 512GB (This will be the first storage disk in the SAN)
			   Don't worry too much about worrying how much storage we'll need. We'll be able to extend the drive later on by simply adding more disks and adding them to the ZFS pool. 
		2. **Network Adaptor**s:
			1. **First Network Adaptor:** *VM Network*
			1. **Second Network Adaptor:** *SAN Network*
		2. **CD/DVD Drive 1:** rhel-baseos-9.0-x86_64-dvd.iso
		3. **VM Options**
			1. **Boot Options**
				1. Untick *Enable UEFI secure boot*, as so we can load the ZFS modules into the kernel later on
1. Log onto the core router via Winbox, as so we can observe the DHCP Lease being requested by the virtual machine when it's turned on. 
   Press IP -> DHCP-Server -> Click the *Leases* tab
3. Turn on the virtual machine. 
4. Back on Winbox in our Leases tab, double click the DHCP lease when it shows up, and click the make static. Press OK. 
5. Double click on the DHCP lease again, this time it will allow you to edit the properties of the lease. Configure the IP address to `10.0.0.1`
6. Reboot the virtual machine

## RHEL 9 Installation

1. Select Install from the boot menu.
2. Select your language, click next
3. Enter the required configurations
	1. **Network & Hostname**
		1. Set hostname to your desired hostname, e.g *nfs.san.dingo.services*
		2. Click Ethernet (ens192), and press *Configure*
			1. Ethernet Tab
				1. Set MTU to 9000
			2. IPv4 Settings Tab
				1. Set search domains, in this case that will be dingo.services, san.dingo.services
			2. IPv6 Settings Tab
				1. Set search domains, in this case that will be dingo.services, san.dingo.services
				2. Method: Manual
				3. Click the *Add* button besides the *Addresses* box. 
				4. Add your desired IPv6 address here. 
				   Note that you will need to use a smaller prefix then /64.  
		1.  Disable KDUMP
		2. Disks
			1. Select the 32GB Drive, leave automatic configuration enabled, encryption disabled.
		2. Software Source
			1. Select "Minimal Install"
		2. Connect to Red Hat
		3. Installation Source
			1. Select Red Hat CDN
		2. Time Zone: UTC
		3. User Passwords
			1. Make User Administrator
			2. Leave *root* untouched
	3. Click Begin Install

## Intermission

We'll need a way to manage the server, so let's take a moment to explain how we'll do that without resorting to the console found within the ESXI Web UI.

If you SSH onto the Mikrotik via the additional IP address now located on ether1 of our Mikrotik CHR, then you'll have access to the Mikrotik's shell prompt. 
Running `/system ssh address=<address-of-server> user=<username>` will let you SSH to other servers within the internal networks of ESXI. 

This is definitely not ideal, but it is a useful stopgap until we create an OSPF network between my core router, and my own local Mikrotik router. 

## RHEL 9 Configuration

Right, finally. Let's make a fileserver... but first, let's install ZFS.

### ZFS Installation

1. `dnf install https://zfsonlinux.org/epel/zfs-release-2-2$(rpm --eval "%{dist}").noarch.rpm`
2. `dnf config-manager --disable zfs`
3. `dnf config-manager --enable zfs-kmod`
4. `dnf install zfs`
5. `modprobe zfs`

### ZFS Configuration

1. Create the ZFS storage pool.  
  `zpool create storage /dev/sdb`

2. Run `zfs list` to confirm the creation of the ZFS storage pool was successful
   ```bash
   [root@nfs ~] zfs list
   NAME      USED  AVAIL     REFER  MOUNTPOINT
   storage   105K   492G       24K  /storage
   ```

### NFS Configuration

Run the following commands to install & configure NFS.
We'll also disable the firewall here, but you can also allow NFS through if this is an operational concern.

1. `systemctl disable --now firewalld`
2. `dnf install nfs-utils`
3. `systemctl enable --now rpcbind`
4. `systemctl enable --now nfs-server`
5. `systemctl status nfs-server`

### NFS Tuning

1. Tweak NFS parameters within */etc/nfs.conf*
	1. Increase the number of threads, mind to keep this figure to a number divisible by 8.
	I've used 128, but this is a integer best found by trial and error via performance testing. 
    ```
    [nfsd]
    threads=128
    ```

	2. Restart the nfs-server service.
	`systemctl restart nfs-server` 

2. Tweak kernel network parameters
   1. Run the following command to insert the following network kernel tweaks into `/etc/sysctl.d/nfs.conf`
   ```bash
   cat <<EOF | sudo tee /etc/sysctl.d/nfs.conf
   net.core.rmem_default = 4194304
   net.core.rmem_max = 4194304
   net.core.wmem_default = 4194304
   net.core.wmem_max = 4194304
   EOF
   ```

   2. Apply the sysctl configuration by running 
   `sysctl -p /etc/sysctl.d/nfs.conf`

### Creating Shares

Here is my methodology for creating shares for later deployments. No need to really rememebr or action any of this, as later articles will specify how to create the ZFS shares, and exporting these shares via NFS

1. Create required ZFS shares
```bash
zfs create storage/static-volumes/<folder_a>/<folder_b>
```

2. Create an export within `/etc/exports`
    1. Edit `/etc/exports`
	`vim /etc/exports`

	2. Paste the following block into the open text editor. This will only allow `10.0.0.0/14` to access this share.
	Tweak as desired. 
	```
	### NFS Export for <FQDN of service>
	/storage/static-volumes/<folder_a>/<folder_b> 10.0.0.0/14(rw,async,no_root_squash,no_wdelay,no_subtree_check)
	```

	3. Run the following command to confirm that the edit is syntaxically correct, and export the share.
	`exportfs -arv` 