#!/bin/zsh

# 设置终端标题
echo -e "\033]0;Night Dev Environment Starter\007"

echo "启动 Redis..."
# 在新的终端窗口中启动 Redis
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal --title="Redis Server" -- redis-server &
elif command -v konsole &> /dev/null; then
    konsole --title "Redis Server" -e redis-server &
elif command -v xterm &> /dev/null; then
    xterm -title "Redis Server" -e redis-server &
else
    # 如果没有图形终端，在后台启动
    redis-server &
fi

# 等待2秒
sleep 2

echo "启动 Bun 后端..."
# 在新的终端窗口中启动后端
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal --title="Bun Backend" --working-directory="$(pwd)/lumin-server" -- yarn dev &
elif command -v konsole &> /dev/null; then
    konsole --title "Bun Backend" --workdir "$(pwd)/lumin-server" -e yarn dev &
elif command -v xterm &> /dev/null; then
    xterm -title "Bun Backend" -e "cd $(pwd)/lumin-server && yarn dev" &
else
    # 如果没有图形终端，在后台启动
    (cd lumin-server && yarn dev) &
fi

echo "启动 Vite 前端..."
# 在新的终端窗口中启动前端
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal --title="Vite Frontend" --working-directory="$(pwd)/lumin-client" -- yarn dev &
elif command -v konsole &> /dev/null; then
    konsole --title "Vite Frontend" --workdir "$(pwd)/lumin-client" -e yarn dev &
elif command -v xterm &> /dev/null; then
    xterm -title "Vite Frontend" -e "cd $(pwd)/lumin-client && yarn dev" &
else
    # 如果没有图形终端，在后台启动
    (cd lumin-client && yarn dev) &
fi

echo "所有服务已启动！请检查各终端窗口 🐾"
echo "按 Enter 键退出..."
read