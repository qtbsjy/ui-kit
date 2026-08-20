// 声明 .css 副作用导入（供 lib 的 dts 生成识别，lib include 只含 src/）
// 应用侧由根 env.d.ts 的 vite/client 覆盖；这里补一份给 lib 打包用
declare module '*.css'
