#!/bin/bash

# 设置上海时区
sudo timedatectl set-timezone Asia/Shanghai

# 获取当前日期
current_date=$(date +%F)

# 获取公网 IP 地址
public_ip=$(curl -s -4 ifconfig.me)

# 生成新的 root 密码
new_password="$current_date-$public_ip"

# 更新 root 密码
printf "%s\\n%s\\n" "$new_password" "$new_password" | sudo passwd root

# 允许 root 用户通过 SSH 登录
echo 'PermitRootLogin yes' | sudo tee -a /etc/ssh/sshd_config

# 启用密码认证
sudo sed -i '/^\[#\\?\]PasswordAuthentication/d' /etc/ssh/sshd_config
echo 'PasswordAuthentication yes' | sudo tee -a /etc/ssh/sshd_config

# 重启 SSH 服务
sudo systemctl restart sshd

# 设置曼谷时区
sudo timedatectl set-timezone Asia/Bangkok