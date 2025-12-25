#!/usr/bin/env python3
"""
监听前端文件变化并自动重新构建
"""
import subprocess
import sys
import os
from pathlib import Path

try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
except ImportError:
    print("❌ 缺少 watchdog 依赖，请运行: poetry add --group dev watchdog")
    print("   或者: pip install watchdog")
    sys.exit(1)

FRONTEND_DIR = Path(__file__).parent / "frontend"
STATIC_DIR = Path(__file__).parent / "static"


class FrontendBuildHandler(FileSystemEventHandler):
    """前端文件变化处理器"""
    
    def __init__(self):
        self.debounce_time = 1.0  # 防抖时间（秒）
        self.last_build_time = 0
        self.building = False
    
    def should_build(self, file_path: Path) -> bool:
        """判断是否需要构建"""
        # 只监听 .tsx, .ts, .jsx, .js, .css 等源文件
        if file_path.suffix not in ['.tsx', '.ts', '.jsx', '.js', '.css', '.json']:
            return False
        
        # 排除 node_modules 和构建输出
        if 'node_modules' in str(file_path) or 'dist' in str(file_path):
            return False
        
        return True
    
    def on_modified(self, event):
        """文件修改事件"""
        if event.is_directory:
            return
        
        file_path = Path(event.src_path)
        
        if not self.should_build(file_path):
            return
        
        if self.building:
            print(f"⏳ 构建中，跳过: {file_path.name}")
            return
        
        import time
        current_time = time.time()
        
        # 防抖：1秒内多次修改只构建一次
        if current_time - self.last_build_time < self.debounce_time:
            return
        
        self.last_build_time = current_time
        self.build_frontend()
    
    def build_frontend(self):
        """构建前端"""
        self.building = True
        print("\n🔄 检测到前端文件变化，开始重新构建...")
        
        try:
            # 运行构建命令（使用 npx 确保能找到 vite）
            result = subprocess.run(
                ["npm", "run", "build"],
                cwd=FRONTEND_DIR,
                capture_output=True,
                text=True,
                timeout=120,  # 2分钟超时
                env={**os.environ, "PATH": f"{FRONTEND_DIR / 'node_modules' / '.bin'}:{os.environ.get('PATH', '')}"}
            )
            
            if result.returncode == 0:
                print("✅ 前端构建成功！")
            else:
                print(f"❌ 构建失败:\n{result.stderr}")
                
        except subprocess.TimeoutExpired:
            print("❌ 构建超时")
        except Exception as e:
            print(f"❌ 构建异常: {str(e)}")
        finally:
            self.building = False


def main():
    """主函数"""
    if not FRONTEND_DIR.exists():
        print(f"❌ 前端目录不存在: {FRONTEND_DIR}")
        sys.exit(1)
    
    print(f"👀 开始监听前端文件变化: {FRONTEND_DIR}")
    print("📦 修改前端文件将自动重新构建到 static/ 目录")
    print("按 Ctrl+C 停止监听\n")
    
    # 创建观察者
    event_handler = FrontendBuildHandler()
    observer = Observer()
    observer.schedule(event_handler, str(FRONTEND_DIR), recursive=True)
    observer.start()
    
    try:
        # 初始构建
        print("🔨 执行初始构建...")
        subprocess.run(["npm", "run", "build"], cwd=FRONTEND_DIR, check=False)
        print("✅ 初始构建完成\n")
        
        # 保持运行
        while True:
            import time
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n👋 停止监听")
        observer.stop()
    finally:
        observer.join()


if __name__ == "__main__":
    main()

