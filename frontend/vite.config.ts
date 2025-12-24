import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 自定义插件：在构建前备份 uploads 目录，构建后恢复
const preserveUploadsPlugin = () => {
  let backupDir: string | null = null
  
  return {
    name: 'preserve-uploads',
    buildStart() {
      const staticDir = path.resolve(__dirname, '../static')
      const uploadsDir = path.join(staticDir, 'uploads')
      // 将备份目录放在 static 目录外，避免被 emptyOutDir 清空
      backupDir = path.resolve(__dirname, '../.uploads_backup')
      
      // 如果 uploads 目录存在，备份它
      if (fs.existsSync(uploadsDir)) {
        console.log('📦 备份 uploads 目录...')
        if (fs.existsSync(backupDir)) {
          fs.rmSync(backupDir, { recursive: true, force: true })
        }
        fs.cpSync(uploadsDir, backupDir, { recursive: true })
        console.log('✅ uploads 目录已备份')
      }
    },
    closeBundle() {
      // 在所有文件写入完成后恢复 uploads 目录
      if (backupDir && fs.existsSync(backupDir)) {
        const staticDir = path.resolve(__dirname, '../static')
        const uploadsDir = path.join(staticDir, 'uploads')
        
        console.log('📦 恢复 uploads 目录...')
        if (fs.existsSync(uploadsDir)) {
          fs.rmSync(uploadsDir, { recursive: true, force: true })
        }
        fs.cpSync(backupDir, uploadsDir, { recursive: true })
        fs.rmSync(backupDir, { recursive: true, force: true })
        console.log('✅ uploads 目录已恢复')
      } else {
        // 如果备份不存在，确保 uploads 目录存在
        const staticDir = path.resolve(__dirname, '../static')
        const uploadsDir = path.join(staticDir, 'uploads')
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true })
          // 创建 .gitkeep 文件
          fs.writeFileSync(path.join(uploadsDir, '.gitkeep'), '')
          console.log('✅ 创建 uploads 目录')
        }
      }
    }
  }
}

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    preserveUploadsPlugin(), // 添加保护 uploads 目录的插件
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: '../static',
    emptyOutDir: true, // 可以清空，因为我们会在构建后恢复 uploads
    assetsDir: 'assets',
  },
  base: '/',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
