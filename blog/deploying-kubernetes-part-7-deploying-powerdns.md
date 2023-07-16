---
title: Deploying PowerDNS
series: 
  name: Deploying Kubernetes
  part: 7
tags: [deploying, kubernetes, linux, part7, instructional, powerdns, dns, authoritative, pdns]
description: "Welcome to the sixth part of our series on deploying Kubernetes! In this tutorial, we will be discussing how to deploy NFS provisioner for dynamic volume provisioning."
date: 2023-01-08
author: "martin-george"
preview_image: /images/deploying-kubernetes-part-7-deploying-powerdns/powerdns.png
layout: ../../layouts/Blog/BlogPost/BlogPost.astro

---

# Deploying Kubernetes - Part 7 - Deploying PowerDNS


Welcome to the seventh part of our series on deploying Kubernetes! In this tutorial, we will be focusing on deploying PowerDNS in a Kubernetes cluster.

PowerDNS is an open-source DNS server that is widely used for hosting domains and providing DNS services. It is known for its high performance, security, and flexibility. In this tutorial, we will be setting up a PowerDNS server with three nameservers: a core server, and two front-end servers (referred to as nameserver a and nameserver b).

Before we can deploy PowerDNS, we need to do some preparation work. This includes creating ZFS datasets and database directories, as well as setting up NFS exports. 

Next, we will be creating a persistent volume (PV) manifest and deploying that to the cluster. 

Then, we will add the *helm-powerdns-authoritative* repository as a Helm chart source and use it to install the PowerDNS chart.

### ZFS Dataset Creation

We will begin by creating ZFS datasets for storing the PowerDNS data. ZFS is a filesystem that provides advanced features such as data compression, snapshots, and checksums. To create the datasets, we will run the following commands:

1.  `zfs create storage/static-volumes`
2.  `zfs create storage/static-volumes/dingo.services`
3.  `zfs create storage/static-volumes/dingo.services/nic.dingo.services`
4.  `zfs create storage/static-volumes/dingo.services/nic.dingo.services/dns.nic.dingo.services`
5.  `zfs create storage/static-volumes/dingo.services/nic.dingo.services/dns.nic.dingo.services/core.dns.nic.dingo.services`
6.  `zfs create storage/static-volumes/dingo.services/nic.dingo.services/dns.nic.dingo.services/front-end.dns.nic.dingo.services`
7.  `zfs create storage/static-volumes/dingo.services/nic.dingo.services/dns.nic.dingo.services/front-end.dns.nic.dingo.services/ns-a.front-end.dns.nic.dingo.services`
8.  `zfs create storage/static-volumes/dingo.services/nic.dingo.services/dns.nic.dingo.services/front-end.dns.nic.dingo.services/ns-b.front-end.dns.nic.dingo.services`

These commands will create a series of nested datasets for storing the PowerDNS data.

### Database Directories

Next, we need to create directories for storing the PowerDNS databases. We will create a database directory for each of the three nameservers: the core server, and nameserver a and b.

To create the database directories and apply the necessary permissions, run the following commands:

1.  Create the _core nameserver_ database directory and apply permissions:
    1.  `mkdir /storage/static-volumes/dingo.services/nic.dingo.services/dns.nic.dingo.services/core.dns.nic.dingo.services/db`
    2.  `chown 999:999 /storage/static-volumes/dingo.services/nic.dingo.services/dns.nic.dingo.services/core.dns.nic.dingo.services/db`
2.  Create the _nameserver a_ database directory and apply permissions:
   1.  `mkdir /storage/static-volumes/dingo.services/nic.dingo.services/dns.nic.dingo.services/front-end.dns.nic.dingo.services/ns-a.front-end.dns.nic.dingo.services/db`
   2.  `chown 999:999 /storage/static-volumes/dingo.services/nic.dingo.services/dns.nic.dingo.services/front-end.dns.nic.dingo.services/ns-a.front-end.dns.nic.dingo.services/db`
3. Create the _nameserver b_ database directory and apply permissions:
    1.  `mkdir /storage/static-volumes/dingo.services/nic.dingo.services/dns.nic.dingo.services/front-end.dns.nic.dingo.services/ns-b.front-end.dns.nic.dingo.services/db`
    2.  `chown 999:999 /storage/static-volumes/dingo.services/nic.dingo.services/dns.nic.dingo.services/front-end.dns.nic.dingo.services/ns-b.front-end.dns.nic.dingo.services/db`

These commands will create the database directories and apply the necessary permissions for each of the three nameservers.

### NFS Exports

Finally, we need to set up NFS exports for the ZFS datasets we created earlier. NFS (Network File System) is a protocol that allows a computer to share its files with other computers over a network. We will use NFS to mount the ZFS datasets on the PowerDNS pods.

To set up the NFS exports, append the following lines to the `/etc/exports` file:

```
# NFS exports for core.dns.nic.dingo.services
/storage/static-volumes/dingo.services/nic.dingo.services/dns.nic.dingo.services/core.dns.nic.dingo.services 10.0.0.0/14(rw,async,no_root_squash,no_wdelay,no_subtree_check)

# NFS exports for ns-a.front-end.dns.nic.dingo.services
/storage/static-volumes/dingo.services/nic.dingo.services/dns.nic.dingo.services/front-end.dns.nic.dingo.services/ns-a.front-end.dns.nic.dingo.services 10.0.0.0/14(rw,async,no_root_squash,no_wdelay,no_subtree_check)

# NFS exports for ns-b.front-end.dns.nic.dingo.services
/storage/static-volumes/dingo.services/nic.dingo.services/dns.nic.dingo.services/front-end.dns.nic.dingo.services/ns-b.front-end.dns.nic.dingo.services 10.0.0.0/14(rw,async,no_root_squash,no_wdelay,no_subtree_check)
```



## PV Manifest

A PV manifest is a configuration file that specifies the details of a persistent volume in Kubernetes. This includes the capacity, access modes, and the location of the volume. In this case, we will create a PV manifest for the PowerDNS core server.

### Core Nameserver

To create the PV manifest for the core nameserver, follow these steps:

1.  Create a file called `pv-core.dns.nic.dingo.services.yaml`.
2.  Paste the following contents into the file:
```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-core-nic-dns-dingo-services
spec:
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteMany
  nfs:
    server: 10.0.0.1
    path: "/storage/static-volumes/dingo.services/nic.dingo.services/dns.nic.dingo.services/core.dns.nic.dingo.services"
```

This PV manifest defines a persistent volume with a capacity of 1Gi and access mode of ReadWriteMany. The volume is located on an NFS server at the specified path.

3.  Run the following command to create a namespace for the PowerDNS core server:

```bash
kubectl create namespace dns.nic.dingo.services
```

4.  Apply the PV manifest to the cluster by running the following command:
```bash
kubectl apply -f pv-core.dns.nic.dingo.services.yaml
```

### Nameserver A

Now we will create a PV for a front-end nameserver, called Nameserver A.

To configure the PV, follow these steps:

1.  Create a file called `pv-ns-a.front-end.dns.nic.dingo.services.yml`.
2.  Paste the following contents into the file:
```yaml
apiVersion: v1
 kind: PersistentVolume
 metadata:
   name: pv-ns-a-front-end-dns-nic-dingo-services
 spec:
   capacity:
     storage: 1Gi
   accessModes:
     - ReadWriteMany
   nfs:
     server: 10.0.0.1
     path: "/storage/static-volumes/dingo.services/nic.dingo.services/dns.nic.dingo.services/front-end.dns.nic.dingo.services/ns-a.front-end.dns.nic.dingo.services"
```

This PV manifest defines a persistent volume with a capacity of 1Gi and access mode of ReadWriteMany. The volume is located on an NFS server at the specified path.

3.  Apply the PV manifest to the cluster by running the following command:
```bash
kubectl apply -f pv-ns-a.front-end.dns.nic.dingo.services.yml
```

### Nameserver B

Finally, we will create a PV for Nameserver B.

To configure the PV, follow these steps:

1.  Create a file called `pv-ns-b.front-end.dns.nic.dingo.services.yml`.
2.  Paste the following contents into the file:
```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-ns-b-front-end-dns-nic-dingo-services
spec:
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteMany
  nfs:
    server: 10.0.0.1
    path: "/storage/static-volumes/dingo.services/nic.dingo.services/dns.nic.dingo.services/front-end.dns.nic.dingo.services/ns-b.front-end.dns.nic.dingo.services"
```

This PV manifest defines a persistent volume with a capacity of 1Gi and access mode of ReadWriteMany. The volume is located on an NFS server at the specified path.

3.  Apply the PV manifest to the cluster by running the following command:
```bash
kubectl apply -f pv-ns-b.front-end.dns.nic.dingo.services.yml
```


## Helm

[Helm](https://helm.sh/) is a package manager for Kubernetes that allows you to easily install and manage applications in your cluster. We will use Helm to install the PowerDNS chart in the cluster.

Follow these steps to install the PowerDNS chart using Helm:

1.  Add the helm-powerdns-authoritative repository as a Helm chart source by running the following command:

```bash
helm repo add helm-powerdns-authoritative https://martydingo.github.io/helm-powerdns-authoritative/
```

### Core Nameserver

1.  Create a file called `helm-pdns-auth-core-values.yml` and paste the following contents into it:
```yaml
   # Declare variables to be passed into the helm chart.

   # nameOverride: ""
   # fullnameOverride: ""
   imagePullSecrets: []

   storage:
     volumeClaimTemplate:
       accessMode: ReadWriteMany
       storageClassName: ""
       # If not using dynamic persistent storage, a persistentVolume configuration will need to be configured, and the pvName configured below.
       volumeName: "pv-core-dns-nic-dingo-services"
       resources:
         requests:
           storage: 1Gi

   mariadb:
     replicaCount: 1
     configuration:
       # A randomized root password will be configured, if rootPassword is declared undefined, and will be dumped to the database pods stdout (kubectl logs <db_pod>)
       rootPassword: 
       database: pdns
       user: pdns
       password: 
     image:
       repository: mariadb
       imagePullPolicy: IfNotPresent
       # This is set as such, as when mariadb doesn't exit cleanly, and a new container is pulled, the database fails to start
       # This is due to the fact that you can't upgrade a database that hasn't exited cleanly.
       tag: "10.7"
     resources:
       # Arbitrary resource values as resource requirements differ between use cases. Please reconfigure if this doesn't meet your requirements
       requests:
         memory: 128Mi
         cpu: 125m
       limits:
         memory: 512Mi
         cpu: 8000m
     service:
       type: ClusterIP
       clusterIP: "None"
       ipFamilyPolicy: PreferDualStack
       # Affects service and pdns configuration
       ports:
         db: 3306

   pdns:
     replicaCount: 1
     image:
       repository: powerdns/pdns-auth-master
       imagePullPolicy: IfNotPresent
       tag: "20220225"
     resources:
       # Arbitrary resource values as resource requirements differ between use cases. Please reconfigure if this doesn't meet your requirements
       requests:
         memory: 128Mi
         cpu: 125m
       limits:
         memory: 512Mi
         cpu: 8000m
     service:
       # Only affects the created kubernetes service
       type: LoadBalancer
       annotations:
         metallb.universe.tf/loadBalancerIPs: 100.66.0.1,fd:0:0:0:fe:66::1
       ipFamilyPolicy: PreferDualStack
       ports:
         dns: 53
         api: 8081
     configuration:
       # All values from https://doc.powerdns.com/authoritative/settings.html can be removed/added here as \<key\>: \<value\> pairs.
       # See usage of 'pdnsutil hash-password' for more information on webserver passwords & API keys - kubectl exec -it <pdns_pod_name> -- pdnsutil hash-password
       # and https://doc.powerdns.com/authoritative/settings.html#setting-webserver-password
       # ---
       api-key: 
       version-string: anonymous
       webserver: yes
       webserver-address: 0.0.0.0
       webserver-allow-from: 0.0.0.0/0
       primary: yes
       api: yes
       dnsupdate: yes
       allow-dnsupdate-from: 10.0.0.0/14
       allow-axfr-ips: 10.0.0.0/14
       also-notify: 100.66.2.1, 100.66.3.1
       default-soa-edit: EPOCH
       default-soa-content: core.dns.nic.dingo.services abuse.dns.nic.@ 0 10800 3600 604800 3600
       default-ttl: 60
       default-ksk-algorithm: ed25519
       svc-autohints: yes
```

2.  Configure the `api-key` and database settings in the `helm-pdns-auth-core-values.yml` file, as well as the `default-soa-content` value. 
    
3.  Install the PowerDNS chart by running the following command:
```bash
helm install -n dns-nic-dingo-services core-dns-nic-dingo-services helm-powerdns-authoritative/helm-powerdns-authoritative -f helm-pdns-auth-core-values.yml
```

This should result in a fully functional PowerDNS core nameserver.

### Nameserver A

1.  Create a file called `helm-pdns-auth-front-end-ns-a-values.yml` and paste the following contents into it:

```yaml
   # Declare variables to be passed into the helm chart.

   # nameOverride: ""
   # fullnameOverride: ""
   imagePullSecrets: []

   storage:
     volumeClaimTemplate:
       accessMode: ReadWriteMany
       storageClassName: ""
       # If not using dynamic persistent storage, a persistentVolume configuration will need to be configured, and the pvName configured below.
       volumeName: "pv-ns-a-front-end-dns-nic-dingo-services"
       resources:
         requests:
           storage: 1Gi

   mariadb:
     replicaCount: 1
     configuration:
       # A randomized root password will be configured, if rootPassword is declared undefined, and will be dumped to the database pods stdout (kubectl logs <db_pod>)
       rootPassword: 
       database: pdns
       user: pdns
       password: 
     image:
       repository: mariadb
       imagePullPolicy: IfNotPresent
       # This is set as such, as when mariadb doesn't exit cleanly, and a new container is pulled, the database fails to start
       # This is due to the fact that you can't upgrade a database that hasn't exited cleanly.
       tag: "10.7"
     resources:
       # Arbitrary resource values as resource requirements differ between use cases. Please reconfigure if this doesn't meet your requirements
       requests:
         memory: 128Mi
         cpu: 125m
       limits:
         memory: 512Mi
         cpu: 8000m
     service:
       type: ClusterIP
       clusterIP: "None"
       ipFamilyPolicy: PreferDualStack
       # Affects service and pdns configuration
       ports:
         db: 3306

   pdns:
     replicaCount: 1
     image:
       repository: powerdns/pdns-auth-master
       imagePullPolicy: IfNotPresent
       tag: "20220225"
     resources:
       # Arbitrary resource values as resource requirements differ between use cases. Please reconfigure if this doesn't meet your requirements
       requests:
         memory: 128Mi
         cpu: 125m
       limits:
         memory: 512Mi
         cpu: 8000m
     service:
       # Only affects the created kubernetes service
       annotations:
         metallb.universe.tf/loadBalancerIPs: 100.66.1.1,fd:0:0:0:fe:66:1:1
       type: LoadBalancer
       ipFamilyPolicy: PreferDualStack
       ports:
         dns: 53
         api: 8081
     configuration:
       # All values from https://doc.powerdns.com/authoritative/settings.html can be removed/added here as \<key\>: \<value\> pairs.
       # See usage of 'pdnsutil hash-password' for more information on webserver passwords & API keys - kubectl exec -it <pdns_pod_name> -- pdnsutil hash-password
       # and https://doc.powerdns.com/authoritative/settings.html#setting-webserver-password
       # ---
       api-key: 
       version-string: anonymous
       webserver: yes
       webserver-address: 0.0.0.0
       webserver-allow-from: 0.0.0.0/0
       secondary: yes
       autosecondary: yes
       api: yes
       dnsupdate: yes
       allow-dnsupdate-from: 10.1.0.0/16
```

2.  Configure the `api-key` and database settings in the `helm-pdns-auth-front-end-ns-a-values.yml` file, as well as the `default-soa-content` value. .
    
3.  Install the front-end nameserver by running the following command:

```bash
helm install -n dns-nic-dingo-services ns-a-front-end-dns-nic-dingo-services helm-powerdns-authoritative/helm-powerdns-authoritative -f helm-pdns-auth-front-end-ns-a-values.yml
```

This should result in a fully functional front-end nameserver A.

### Nameserver B

1.  Create a file called `helm-pdns-auth-front-end-ns-a-values.yml` and paste the following contents into it:

```yaml
   # Declare variables to be passed into the helm chart.
   
   # nameOverride: ""
   # fullnameOverride: ""
   imagePullSecrets: []
   
   storage:
   volumeClaimTemplate:
      accessMode: ReadWriteMany
      storageClassName: ""
      # If not using dynamic persistent storage, a persistentVolume configuration will need to be configured, and the pvName configured below.
      volumeName: "pv-ns-b-front-end-dns-nic-dingo-services"
      resources:
         requests:
         storage: 1Gi
   
   mariadb:
     replicaCount: 1
     configuration:
      # A randomized root password will be configured, if rootPassword is declared undefined, and will be dumped to the database pods stdout (kubectl logs <db_pod>)
       rootPassword: 
       database: pdns
       user: pdns
       password: 
   image:
      repository: mariadb
      imagePullPolicy: IfNotPresent
      # This is set as such, as when mariadb doesn't exit cleanly, and a new container is pulled, the database fails to start
      # This is due to the fact that you can't upgrade a database that hasn't exited cleanly.
      tag: "10.7"
   resources:
      # Arbitrary resource values as resource requirements differ between use cases. Please reconfigure if this doesn't meet your requirements
      requests:
         memory: 128Mi
         cpu: 125m
      limits:
         memory: 512Mi
         cpu: 8000m
   service:
      type: ClusterIP
      clusterIP: "None"
      ipFamilyPolicy: PreferDualStack
      # Affects service and pdns configuration
      ports:
         db: 3306
   
   pdns:
   replicaCount: 1
   image:
      repository: powerdns/pdns-auth-master
      imagePullPolicy: IfNotPresent
      tag: "20220225"
   resources:
      # Arbitrary resource values as resource requirements differ between use cases. Please reconfigure if this doesn't meet your requirements
      requests:
         memory: 128Mi
         cpu: 125m
      limits:
         memory: 512Mi
         cpu: 8000m
   service:
      # Only affects the created kubernetes service
      type: LoadBalancer
      annotations:
         metallb.universe.tf/loadBalancerIPs: 100.66.2.1,fd:0:0:0:fe:66:2:1
      ipFamilyPolicy: PreferDualStack
      ports:
         dns: 53
         api: 8081
   configuration:
      # All values from https://doc.powerdns.com/authoritative/settings.html can be removed/added here as \<key\>: \<value\> pairs.
      # See usage of 'pdnsutil hash-password' for more information on webserver passwords & API keys - kubectl exec -it <pdns_pod_name> -- pdnsutil hash-password
      # and https://doc.powerdns.com/authoritative/settings.html#setting-webserver-password
      # ---
      api-key: 
      version-string: anonymous
      webserver: yes
      webserver-address: 0.0.0.0
      webserver-allow-from: 0.0.0.0/0
      secondary: yes
      autosecondary: yes
      api: yes
      dnsupdate: yes
      allow-dnsupdate-from: 10.1.0.0/16
```

2.  Configure the `api-key` and database settings in the `helm-pdns-auth-front-end-ns-a-values.yml` file, as well as the `default-soa-content` value. 
    
3.  Install the front-end nameserver by running the following command:

```bash
helm install -n dns-nic-dingo-services ns-a-front-end-dns-nic-dingo-services helm-powerdns-authoritative/helm-powerdns-authoritative -f helm-pdns-auth-front-end-ns-a-values.yml
```

That should now result in a two functional front-end nameservers, ready to be connected to the core nameserver.

## PowerDNS Maintenance

Here's a script that updates the autoprimaries IP address, and the zone(s) primary nameserver IP address, within the front-end nameservers. This may need to happen each time a new core nameserver container is built, as the IP of the core nameserver changes with every deployment.

This ensures zone additions and updates undertaken on the core nameserver, notify the child front-end nameservers, something that'll become quite important in one of our upcoming guides.

I keep this in a file named `update-master-ip.sh`, feel free to create a cronjob if desired.

```bash
#!/bin/bash

echo "Fetching new core primary pod IP..."
echo "---"
export NEW_MASTER_IP=`kubectl get pods -n dns-nic-dingo-services -o json | jq -r ".items[] | select(select(.metadata.name | test(\"^$1\")).metadata.name | test(\"-db\") | not).status.podIP"`
echo "New core primary pod IP fetched! Found podIP $NEW_MASTER_IP"
echo "---"

echo "Fetching database secret from live deployment..."
echo "---"
export ROOT_DB_SECRET=`kubectl get deployment $1-db -o json | jq -r '.spec.template.spec.containers[0].env[] | select(.name | test("ROOT_PASSWORD")).value'`
echo "Database secret from live deployment fetched! Found secret $ROOT_DB_SECRET"
echo "---"

for EXT_NS_DB in `kubectl get pods -n dns-nic-dingo-services -o json | jq -r '.items[] | select(select(.metadata.name | test("ns")).metadata.name | test("-db")).metadata.name'`;
do
    echo "Updating Master IP on $EXT_NS_DB" to $NEW_MASTER_IP;
    echo "---"
    kubectl exec -n dns-nic-dingo-services -it $EXT_NS_DB -- mysql -D pdns -c -e "update supermasters set ip = '$NEW_MASTER_IP'; update domains set master = '$NEW_MASTER_IP'" -p$ROOT_DB_SECRET
done

echo "All external nameserver databases updated! unsettings environment variables"
echo "---"
unset NEW_MASTER_IP
unset ROOT_DB_SECRET
echo "---"
echo "Environment variables unset! All done!"
echo "---"
```
