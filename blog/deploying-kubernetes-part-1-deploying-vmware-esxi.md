---
title: Deploying VMWare ESXI
series:
  name: Deploying Kubernetes
  part: 5
author: "martin-george"
tags: [deploying, kubernetes, k8s, linux, vmware, esxi, part1, post]
description: "The first part of the *'Deploying Kubernetes'* series. This instructional will cover the deployment of VMWare ESXI, the virtualisation server that will eventually be running our Kubernetes virtual machines!"
date: 2022-08-21
preview_image: /images/deploying-kubernetes-part-1-deploying-vmware-esxi/DeployingVMWare-Step1.png
layout: ../../layouts/Blog/BlogPost/BlogPost.astro
category: Instructional
---

# Deploying Kubernetes Part 1 - Deploying VMWare ESXI

## Introduction

This instructional will cover the deployment of VMWare ESXI, the virtualisation server that will eventually be running our Kubernetes virtual machines!

## Prerequistes

- A dedicated server. This instructional will follow the usage of a Hetzner root server, ordered from Hetzner's server auction, found [here](hetzner.com/sb).

  - Server specifications can vary. I'm using the following specifications:
    - CPU: AMD EPYC 7401P
    - NIC: Intel I350
    - Storage: 2x SSD U.2 NVMe 960 GB Datacenter
    - RAM: 4x RAM 32768 MB DDR4 ECC
  - It's very important that the NIC is **not** a Realtek NIC, as VMWare does not support Realtek NICs and ESXI will fail to install.
  - You will also need at least 1 additional IPv4 address.

- VMware ESXI Installer flashed to a USB driver, plugged into the server.

  - If using Hetzner, this can be requested via submitting a support ticket via the Robot control panel, by providing a link to the ISO and requesting that they flash a USB drive with the provided ISO and plug it into your server.
  - I'll be using the ISO image with the filename:
    - `VMware-VMvisor-Installer-7.0U3f-20036589.x86_64.iso`

- Access to a KVM
  - If using Hetzner, this can also be requested via submitting a support ticket via the Robot control panel.
    - It's recommended to await for the USB drive containing the VMWare ESXI installer to be plugged in before submitting a request for the KVM, as access to the KVMs are timed, and it can take a varying amount of time for Hetzner to connect the USB drive.

## Installation of VMWare ESXI

1. We'll begin by starting from the ESXI installer boot splash page.
   ![Deploying VMWare ESXI Step 1](../../assets/images/deploying-kubernetes-part-1-deploying-vmware-esxi/DeployingVMWare-Step1.png)

2. Select a disk.
   I recommend selecting the first disk, as it will be much easier to remember for later steps.
   ![Deploying VMWare ESXI Step 2](../../assets/images/deploying-kubernetes-part-1-deploying-vmware-esxi/DeployingVMWare-Step2.png)

3. Select a keyboard layout.
   ![Deploying VMWare ESXI Step 3](../../assets/images/deploying-kubernetes-part-1-deploying-vmware-esxi/DeployingVMWare-Step3.png)

4. Enter a password for the `root` user.
   ![Deploying VMWare ESXI Step 4](../../assets/images/deploying-kubernetes-part-1-deploying-vmware-esxi/DeployingVMWare-Step4.png)

5. ESXI will now install.
   ![Deploying VMWare ESXI Step 5](../../assets/images/deploying-kubernetes-part-1-deploying-vmware-esxi/DeployingVMWare-Step5.png)

6. When the installation completes, you'll see a window asking you to remove the install media & reboot the server.
   ![Deploying VMWare ESXI Step 6-1](../../assets/images/deploying-kubernetes-part-1-deploying-vmware-esxi/DeployingVMWare-Step6-1.png)

   Ignore the warning about the removal of install media, and hit enter. You will then see a message indicating the server will reboot.
   ![Deploying VMWare ESXI Step 6-2](../../assets/images/deploying-kubernetes-part-1-deploying-vmware-esxi/DeployingVMWare-Step6-2.png)

7. On reboot, the system will initalize, this may take some time. Eventually, the system will rest at the following screen.
   ![Deploying VMWare ESXI Step 7](../../assets/images/deploying-kubernetes-part-1-deploying-vmware-esxi/DeployingVMWare-Step7.png)

   **NOTE:** The management FQDN's have been redacted above.

8. Before we complete the installation and quit the KVM, we'll enable SSH, as the web user interface is most likely already locked from various bruteforcing attempts from various internet explorers. We'll also need SSH enabled for the optional steps that follow later on in this article.

   Press F2, then login.

   ![Deploying VMWare ESXI Step 8-1](../../assets/images/deploying-kubernetes-part-1-deploying-vmware-esxi/DeployingVMWare-Step8-1.png)

   Select troubleshooting options, and press enter.

   ![Deploying VMWare ESXI Step 8-2](../../assets/images/deploying-kubernetes-part-1-deploying-vmware-esxi/DeployingVMWare-Step8-2.png)

   Then highlight Enable SSH, and press enter.

   ![Deploying VMWare ESXI Step 8-3](../../assets/images/deploying-kubernetes-part-1-deploying-vmware-esxi/DeployingVMWare-Step8-3.png)

   It should flip to 'SSH is Enabled'.

   ![Deploying VMWare ESXI Step 8-4](../../assets/images/deploying-kubernetes-part-1-deploying-vmware-esxi/DeployingVMWare-Step8-4.png)

9. Login via SSH onto your ESXI host, as root.
   ![Deploying VMWare ESXI Step 9](../../assets/images/deploying-kubernetes-part-1-deploying-vmware-esxi/DeployingVMWare-Step9.png)

10. We can unlock the ESXI web GUI by running `pam_tally2 --reset`.
    ![Deploying VMWare ESXI Step 10](../../assets/images/deploying-kubernetes-part-1-deploying-vmware-esxi/DeployingVMWare-Step10.png)

## (Optional) Add an extra physical disk to an existing ESXI datastore.

We'll reconfigure the ESXI datastore _datastore1_ by adding an additional drive to the datastore.

1. Log onto the ESXI web GUI.

2. Click _Storage_, found within the menu on the left hand side of the page.

3. Click _datastore1_.

4. Click the Actions button, found within the row of buttons at the top of the page, then click on _Increase Capacifty_.

5. Select _Add an extent to an existing VMFS datastore_.

6. Select the drive to be added into _datastore1_.

7. The default parititioning option _Use full disk_ should already be selected. If not, select it, then press next.

8. Then press _Finish_ on the following summary page. An erasure warning will then present itself. Confirm the erasure by pressing _Yes_.

9. Click _Storage_ again, found within the menu on the left hand side of the page, and confirm that _datastore1_ has increased in capacity.

And that's all there is to adding an extra physical disk to an existing ESXI datastore!
