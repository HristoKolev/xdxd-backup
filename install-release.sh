#!/usr/bin/env bash

set -exu

rsync -aP ./target/release/xdxd-backup root@docker-vm1.lan:/root/xdxd-backup
