const { execSync } = require('child_process')
const cwd = 'D:/Blue/web-tools/ui-kit'
execSync('git add -A', { cwd })
const msg = '作品㊴ UiSteps 步骤条：状态机 + 横/纵向 + 可点击跳转 + 错误态 + 25测试'
console.log(execSync(`git commit -m "${msg}"`, { cwd, encoding: 'utf8' }))
console.log(execSync('git push origin main 2>&1', { cwd, encoding: 'utf8' }))
