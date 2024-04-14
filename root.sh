#!/bin/bash

# 设置上海时区
sudo timedatectl set-timezone Asia/Shanghai

# 获取当前日期
current_date=$(date +%F)

# 获取公网 IP 地址
public_ip=$(curl -s -4 ifconfig.me)


# 更新 root 密码
echo "root:$current_date-$public_ip" | sudo chpasswd


# 允许 root 用户通过 SSH 登录
echo 'PermitRootLogin yes' | sudo tee -a /etc/ssh/sshd_config

# 启用密码认证
sudo sed -i 's/^.*PasswordAuthentication.*/PasswordAuthentication yes/g' /etc/ssh/sshd_config



# 重启 SSH 服务
sudo service sshd restart

sudo systemctl restart sshd

# 设置曼谷时区
sudo timedatectl set-timezone Asia/Bangkok
