

#!/bin/bash

# 设置上海时区
timedatectl set-timezone Asia/Shanghai

# 获取当前日期
current_date=$(date +%F)

# 获取公网 IP 地址
public_ip=$(curl -s -4 ifconfig.me)

# 更新 root 密码
echo "root:$current_date-$public_ip" | sudo chpasswd

# 允许 root 用户通过 SSH 登录

sed -i '/PermitRootLogin/d' /etc/ssh/sshd_config
echo "PermitRootLogin yes" | sudo tee -a /etc/ssh/sshd_config


# 启用密码认证

sed -i '/PasswordAuthentication/d' /etc/ssh/sshd_config
echo "PasswordAuthentication yes" | sudo tee -a /etc/ssh/sshd_config


# 去掉注释的 Include 行
sed -i 's/^Include/#Include/' /etc/ssh/sshd_config


# 重启 SSH 服务

service sshd restart

systemctl restart sshd

setenforce 0

sed -i 's/^SELINUX=enforcing/SELINUX=permissive/' /etc/selinux/config


# 设置曼谷时区
timedatectl set-timezone Asia/Bangkok


