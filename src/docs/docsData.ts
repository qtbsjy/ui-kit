// =====================================================================
// UiKit 组件文档数据（作品⑱ · 数据驱动文档站）
// ---------------------------------------------------------------------
// 集中管理所有组件的文档元数据：分类 / 描述 / Props / Slots / Events /
// 示例代码。UI 只负责渲染这份数据 —— 加新组件只需在这里加一条记录，
// 文档站自动生成对应页面，零额外改代码。
// 所有 API 信息均对照 src/components/ui/*.vue 源码逐一核对，保证准确。
// =====================================================================

// ---------- 类型 ----------
export type ApiKind = 'prop' | 'slot' | 'event'

export interface ApiRow {
  kind: ApiKind
  /** prop 名 / 插槽名 / 事件名 */
  name: string
  /** 类型描述（字符串化） */
  type: string
  /** 默认值（- 表示无） */
  default: string
  /** 说明 */
  desc: string
}

export interface DocExample {
  /** 示例标题 */
  title: string
  /** 示例说明 */
  desc: string
  /** 可运行演示的代码（会渲染 + 高亮展示） */
  code: string
}

export interface ComponentDoc {
  /** 组件名（不含 Ui 前缀，用于路由/导航） */
  id: string
  /** 完整组件名 */
  name: string
  /** 中文名 */
  cn: string
  /** 分类：通用 / 表单 / 布局 / 反馈 / 数据 */
  category: string
  /** 一句话简介 */
  tagline: string
  /** 详细说明（支持换行，渲染为段落） */
  desc: string[]
  /** 学到的技术点（作品进化轨迹） */
  learned: string[]
  /** API 表格 */
  api: ApiRow[]
  /** 示例 */
  examples: DocExample[]
}

// ---------- 数据 ----------
export const docs: ComponentDoc[] = [
  // ================= 通用 =================
  {
    id: 'button',
    name: 'UiButton',
    cn: '按钮',
    category: '通用',
    tagline: '按钮组件，多变体多尺寸，支持图标与加载态',
    desc: [
      '最基础的交互组件。内置 primary / secondary / danger / ghost 四种语义变体与 sm / md / lg 三种尺寸。',
      '通过 inheritAttrs 透传全部原生 button 属性（disabled / type / title / @click 等），无需手动 emit。',
    ],
    learned: ['props 定义 + 自定义 validator 校验', 'inheritAttrs + useAttrs 透传原生属性', '具名插槽 + 默认插槽'],
    api: [
      { kind: 'prop', name: 'variant', type: `'primary' | 'secondary' | 'danger' | 'ghost'`, default: `'primary'`, desc: '按钮语义变体' },
      { kind: 'prop', name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, desc: '按钮尺寸' },
      { kind: 'prop', name: 'disabled', type: 'boolean', default: 'false', desc: '是否禁用' },
      { kind: 'prop', name: 'loading', type: 'boolean', default: 'false', desc: '加载态（显示 spinner 并禁用）' },
      { kind: 'prop', name: 'icon', type: 'string', default: "''", desc: '前置图标（emoji 或文本）' },
      { kind: 'slot', name: 'default', type: '-', default: '-', desc: '按钮文字内容' },
      { kind: 'event', name: 'click', type: 'MouseEvent', default: '-', desc: '原生点击事件（透传）' },
    ],
    examples: [
      {
        title: '变体与尺寸',
        desc: '四种语义变体 + 三种尺寸，全部引用设计令牌，随深浅色主题自动换肤。',
        code: `<div class="row">
  <UiButton>主要按钮</UiButton>
  <UiButton variant="secondary">次要按钮</UiButton>
  <UiButton variant="danger">危险按钮</UiButton>
  <UiButton variant="ghost">幽灵按钮</UiButton>
</div>
<div class="row" style="margin-top:12px">
  <UiButton size="sm">小号</UiButton>
  <UiButton size="md">中号</UiButton>
  <UiButton size="lg">大号</UiButton>
  <UiButton icon="⚙️" loading>加载中</UiButton>
  <UiButton disabled>禁用</UiButton>
</div>`,
      },
    ],
  },
  {
    id: 'badge',
    name: 'UiBadge',
    cn: '徽标',
    category: '通用',
    tagline: '彩色徽标 / 状态圆点，支持呼吸动画',
    desc: [
      '轻量状态标识。color 提供 5 种语义色，dot 模式渲染为不带动文字的圆点，配合 pulse 显示呼吸动画（如"在线"指示器）。',
    ],
    learned: ['props 自定义 validator 限制颜色取值', 'Record 颜色映射作为唯一权威来源'],
    api: [
      { kind: 'prop', name: 'color', type: `'blue' | 'green' | 'orange' | 'red' | 'gray'`, default: `'blue'`, desc: '徽标颜色' },
      { kind: 'prop', name: 'dot', type: 'boolean', default: 'false', desc: '圆点模式（不带动文字）' },
      { kind: 'prop', name: 'pulse', type: 'boolean', default: 'false', desc: '圆点模式下呼吸动画' },
      { kind: 'slot', name: 'default', type: '-', default: '-', desc: '徽标文字（dot 模式下忽略）' },
    ],
    examples: [
      {
        title: '颜色徽标',
        desc: '五种语义色，文字带浅色底。',
        code: `<div class="row">
  <UiBadge color="blue">蓝色</UiBadge>
  <UiBadge color="green">绿色</UiBadge>
  <UiBadge color="orange">橙色</UiBadge>
  <UiBadge color="red">红色</UiBadge>
  <UiBadge color="gray">灰色</UiBadge>
</div>`,
      },
      {
        title: '状态圆点',
        desc: 'dot 渲染小圆点，pulse 叠加呼吸动画，常用于"在线/忙碌"指示。',
        code: `<div class="row">
  <span>在线</span>
  <UiBadge color="green" dot pulse />
  <span style="margin-left:12px">离线</span>
  <UiBadge color="gray" dot />
  <span style="margin-left:12px">异常</span>
  <UiBadge color="red" dot />
</div>`,
      },
    ],
  },
  {
    id: 'card',
    name: 'UiCard',
    cn: '卡片',
    category: '通用',
    tagline: '卡片容器，标题 + 主体 + 底部三段式',
    desc: [
      '通用内容容器。title / subtitle props 提供标准头部，也可用 header 插槽完全自定义；footer 插槽用于底部操作区。',
      'hover 开启后悬停上浮效果。无对应插槽时不渲染多余容器，DOM 干净。',
    ],
    learned: ['具名插槽 header / default / footer', '插槽回退（无插槽时不渲染容器）'],
    api: [
      { kind: 'prop', name: 'title', type: 'string', default: "''", desc: '卡片标题' },
      { kind: 'prop', name: 'subtitle', type: 'string', default: "''", desc: '副标题' },
      { kind: 'prop', name: 'hover', type: 'boolean', default: 'false', desc: '悬停上浮效果' },
      { kind: 'slot', name: 'header', type: '-', default: '-', desc: '自定义头部（优先于 title/subtitle）' },
      { kind: 'slot', name: 'default', type: '-', default: '-', desc: '卡片主体内容' },
      { kind: 'slot', name: 'footer', type: '-', default: '-', desc: '底部操作区' },
    ],
    examples: [
      {
        title: '标准卡片',
        desc: 'title + subtitle + 主体 + footer，hover 上浮。',
        code: `<UiCard title="标题卡片" subtitle="副标题说明" hover style="max-width:420px">
  这是卡片主体内容。可以用 header / footer 插槽自定义头部和底部。
  <template #footer><UiButton size="sm">知道了</UiButton></template>
</UiCard>`,
      },
      {
        title: '纯插槽模式',
        desc: '不传 title 时用 header 插槽完全自定义头部区域。',
        code: `<UiCard style="max-width:420px">
  <template #header><strong>纯插槽模式</strong></template>
  <p>不传 title 时用 header 插槽完全自定义头部。</p>
</UiCard>`,
      },
    ],
  },

  // ================= 表单 =================
  {
    id: 'input',
    name: 'UiInput',
    cn: '输入框',
    category: '表单',
    tagline: '文本输入，defineModel 双向绑定 + 前缀插槽 + 错误提示',
    desc: [
      '带 label 的文本输入组件。defineModel 实现 v-model 双向绑定，原生 input 属性（type/placeholder/disabled/maxlength 等）全部透传。',
      'prefix 插槽可放图标/单位；error 非空时显示红框 + 错误提示。',
    ],
    learned: ['defineModel 实现 v-model（Vue 3.4+）', '透传原生 input 属性', 'label + 错误提示 + 前缀插槽'],
    api: [
      { kind: 'prop', name: 'label', type: 'string', default: "''", desc: '字段标签' },
      { kind: 'prop', name: 'error', type: 'string', default: "''", desc: '错误信息（非空时红框提示）' },
      { kind: 'prop', name: 'placeholder', type: 'string', default: "''", desc: '占位提示' },
      { kind: 'prop', name: 'type', type: 'string', default: `'text'`, desc: '原生 input 类型（text/password 等）' },
      { kind: 'prop', name: 'disabled', type: 'boolean', default: 'false', desc: '禁用' },
      { kind: 'slot', name: 'prefix', type: '-', default: '-', desc: '输入框前缀（图标/单位）' },
      { kind: 'event', name: 'update:modelValue', type: 'string', default: '-', desc: 'v-model 更新事件' },
    ],
    examples: [
      {
        title: '基础用法',
        desc: 'label + v-model + placeholder，密码框用 type。',
        code: `<UiInput label="用户名" placeholder="请输入用户名" />
<UiInput label="密码" type="password" placeholder="••••••" />`,
      },
      {
        title: '错误与前缀',
        desc: 'error 显示红框提示，prefix 插槽放图标。',
        code: `<UiInput label="邮箱" error="邮箱格式不正确" placeholder="you@example.com" />
<UiInput label="价格">
  <template #prefix>¥</template>
</UiInput>`,
      },
    ],
  },
  {
    id: 'textarea',
    name: 'UiTextarea',
    cn: '多行文本',
    category: '表单',
    tagline: '多行文本域，行数 + 字符计数 + maxlength',
    desc: [
      '带 label 的文本域。rows 控制行数，showCount 显示字符计数（配合 maxlength 显示 x/50）。',
      'defineModel 双向绑定，error 显示错误提示。',
    ],
    learned: ['defineModel + 透传原生属性', '行数 + 计数（showCount/maxlength）'],
    api: [
      { kind: 'prop', name: 'label', type: 'string', default: "''", desc: '字段标签' },
      { kind: 'prop', name: 'rows', type: 'number', default: '3', desc: '行数' },
      { kind: 'prop', name: 'placeholder', type: 'string', default: "''", desc: '占位提示' },
      { kind: 'prop', name: 'showCount', type: 'boolean', default: 'false', desc: '显示字符计数' },
      { kind: 'prop', name: 'maxlength', type: 'number', default: '-', desc: '最大字符数' },
      { kind: 'prop', name: 'disabled', type: 'boolean', default: 'false', desc: '禁用' },
      { kind: 'prop', name: 'error', type: 'string', default: "''", desc: '错误信息' },
      { kind: 'event', name: 'update:modelValue', type: 'string', default: '-', desc: 'v-model 更新事件' },
    ],
    examples: [
      {
        title: '基础用法',
        desc: '带计数与长度限制的文本域。',
        code: `<UiTextarea label="备注" :rows="3" placeholder="补充说明"
  show-count :maxlength="50" />`,
      },
    ],
  },
  {
    id: 'select',
    name: 'UiSelect',
    cn: '下拉选择',
    category: '表单',
    tagline: '下拉选择，options 数据驱动',
    desc: [
      '基于原生 select 的下拉组件。options 数组驱动渲染，每项可单独 disabled。',
      'defineModel 双向绑定，内置占位选项与下拉箭头。',
    ],
    learned: ['defineModel + options 数据驱动渲染', '导出 SelectOption 接口供类型复用'],
    api: [
      { kind: 'prop', name: 'label', type: 'string', default: "''", desc: '字段标签' },
      { kind: 'prop', name: 'options', type: 'SelectOption[]', default: '-', desc: '选项列表（{label,value,disabled?}）' },
      { kind: 'prop', name: 'placeholder', type: 'string', default: `'请选择'`, desc: '占位选项文字' },
      { kind: 'prop', name: 'disabled', type: 'boolean', default: 'false', desc: '禁用' },
      { kind: 'prop', name: 'error', type: 'string', default: "''", desc: '错误信息' },
      { kind: 'event', name: 'update:modelValue', type: 'string', default: '-', desc: 'v-model 更新事件' },
    ],
    examples: [
      {
        title: '基础用法',
        desc: 'options 数据驱动，label 字段标签。',
        code: `<UiSelect label="优先级"
  :options="[
    { label: '低', value: 'low' },
    { label: '中', value: 'medium' },
    { label: '高', value: 'high', disabled: true },
  ]" />`,
      },
    ],
  },
  {
    id: 'switch',
    name: 'UiSwitch',
    cn: '开关',
    category: '表单',
    tagline: '开关，键盘无障碍 + 过渡动画',
    desc: [
      '布尔开关。defineModel<boolean>，role="switch" + aria-checked + Space/Enter 键盘切换，原生 button 保证无障碍。',
      'activeText / inactiveText 显示开关状态文字。',
    ],
    learned: ['defineModel<boolean>', '键盘无障碍（Space/Enter + aria-checked）', '过渡动画'],
    api: [
      { kind: 'prop', name: 'label', type: 'string', default: "''", desc: '字段标签' },
      { kind: 'prop', name: 'disabled', type: 'boolean', default: 'false', desc: '禁用' },
      { kind: 'prop', name: 'activeText', type: 'string', default: "''", desc: '开启时文字' },
      { kind: 'prop', name: 'inactiveText', type: 'string', default: "''", desc: '关闭时文字' },
      { kind: 'event', name: 'update:modelValue', type: 'boolean', default: '-', desc: 'v-model 更新事件' },
    ],
    examples: [
      {
        title: '基础用法',
        desc: '按钮式开关，带状态文字。',
        code: `<UiSwitch label="开启通知" active-text="开" inactive-text="关" />
<UiSwitch label="深色模式" active-text="深色" inactive-text="浅色" />`,
      },
    ],
  },

  // ================= 表单（复选/单选） =================
  {
    id: 'checkbox',
    name: 'UiCheckbox / UiCheckboxGroup',
    cn: '复选框 / 复选组',
    category: '表单',
    tagline: '复选框 + 复选组，provide/inject 联动 + 全选',
    desc: [
      '复选框：defineModel<boolean> 单选，v-model 双向；label 文案 + 键盘无障碍（原生 input 默认支持空格），自绘 box + svg 对勾。',
      '复选组 UiCheckboxGroup：管理 (string|number|boolean)[] 数组，provide CheckboxGroupKey 给子 UiCheckbox 自动联动多选。',
      'showCheckAll 全选（含半选态 indeterminate），options 数据驱动或插槽自定义子项。',
      '组内 UiCheckbox 带 value 属性，选中即加入/移出数组；独立使用时 value 忽略，走自身 boolean model。',
    ],
    learned: ['provide/inject 组上下文（InjectionKey 类型安全）', 'defineModel<boolean> 与组数组双通道', 'checkbox 半选态（:indeterminate DOM 属性）', '原生 input + label 隐藏美化（opacity:0 + pointer-events:none + 自绘）', '<script setup> 不允许运行时 export，上下文 Key 抽到独立 .ts'],
    api: [
      { kind: 'prop', name: 'modelValue', type: 'boolean', default: 'false', desc: 'v-model 选中状态（独立用时）' },
      { kind: 'prop', name: 'label', type: 'string', default: "''", desc: '展示文案' },
      { kind: 'prop', name: 'disabled', type: 'boolean', default: 'false', desc: '禁用' },
      { kind: 'prop', name: 'value', type: 'string|number|boolean', default: 'true', desc: '组内成员的值（配合 UiCheckboxGroup）' },
      { kind: 'prop', name: 'modelValue（组）', type: '(string|number|boolean)[]', default: '[]', desc: 'UiCheckboxGroup: v-model 选中值数组' },
      { kind: 'prop', name: 'options', type: '{label,value}[]', default: '[]', desc: 'UiCheckboxGroup: 数据驱动子项' },
      { kind: 'prop', name: 'showCheckAll', type: 'boolean', default: 'false', desc: 'UiCheckboxGroup: 显示全选' },
      { kind: 'event', name: 'update:modelValue', type: 'boolean|array', default: '-', desc: 'v-model 更新事件' },
    ],
    examples: [
      {
        title: '独立复选框',
        desc: '单选框 v-model 布尔值。',
        code: `<UiCheckbox v-model="agree" label="我同意用户协议" />
<UiCheckbox label="禁用项" disabled />`,
      },
      {
        title: '复选组 + 全选',
        desc: '数据驱动多选，showCheckAll 一键全选/取消。',
        code: `<UiCheckboxGroup
  v-model="hobbies"
  :options="[{label:'阅读',value:'reading'},{label:'运动',value:'sports'}]"
  label="兴趣爱好"
  show-check-all
/>`,
      },
    ],
  },
  {
    id: 'radio',
    name: 'UiRadio / UiRadioGroup',
    cn: '单选项 / 单选组',
    category: '表单',
    tagline: '单选项 + 单选组，值相等判定 + 原生互斥',
    desc: [
      '单选项 UiRadio：受控，value + modelValue 相等即选中（单选本质是"值相等"），点选更新 model。',
      '单选组 UiRadioGroup：provide RadioGroupKey 给子 UiRadio，组内同值互斥；自动生成 name 供原生 radio 分组（方向键导航受浏览器支持）。',
      'options 数据驱动或插槽自定义子项，支持 string/number/boolean 值。',
    ],
    learned: ['受控组件 + 值相等判定选中', 'provide/inject 组互斥', '原生 radio 同 name 分组（方向键）', '上下文 Key 抽独立 .ts（script setup 不能运行时 export）'],
    api: [
      { kind: 'prop', name: 'modelValue', type: 'string|number|boolean', default: "''", desc: 'v-model 选中值' },
      { kind: 'prop', name: 'label', type: 'string', default: "''", desc: '展示文案' },
      { kind: 'prop', name: 'value', type: 'string|number|boolean', default: '-', desc: '该项的值' },
      { kind: 'prop', name: 'disabled', type: 'boolean', default: 'false', desc: '禁用' },
      { kind: 'prop', name: 'options', type: '{label,value}[]', default: '[]', desc: 'UiRadioGroup: 数据驱动子项' },
      { kind: 'event', name: 'update:modelValue', type: 'string|number|boolean', default: '-', desc: 'v-model 更新事件' },
    ],
    examples: [
      {
        title: '单选组',
        desc: '数据驱动互斥单选，组内方向键切换。',
        code: `<UiRadioGroup
  v-model="gender"
  :options="[{label:'男',value:'male'},{label:'女',value:'female'}]"
  label="性别"
/>`,
      },
    ],
  },
  {
    id: 'slider',
    name: 'UiSlider',
    cn: '滑条',
    category: '表单',
    tagline: '单值 / 双端 range，基于原生 input',
    desc: [
      '滑条：defineModel<number> 单值；range 模式用 [number, number] 双端值（v-model）。',
      '基于原生 input[type=range]——键盘方向键/无障碍/触摸拖动白拿，只做 CSS 美化 + 双 thumb 联动。',
      '双端 range = 两个原生 range 叠加在同一轨道，动态限制下/上限（lower≤upper-step）防交叉。',
      '轨道填充用独立 div 渲染（淡底 bar + 主色 fill），规避 webkit/moz 引擎差异。showValue 显示当前值。',
    ],
    learned: ['defineModel<number> 与 [number,number] 双端', '原生 range 复用（键盘/无障碍/触摸白拿）', '双 range 叠加联动 + 动态 max/min 防交叉', '轨道填充独立 div（引擎无关）', 'script setup 双值受控同步 watch'],
    api: [
      { kind: 'prop', name: 'modelValue', type: 'number|[number,number]', default: '0', desc: 'v-model: 单值或双端数组' },
      { kind: 'prop', name: 'min', type: 'number', default: '0', desc: '最小值' },
      { kind: 'prop', name: 'max', type: 'number', default: '100', desc: '最大值' },
      { kind: 'prop', name: 'step', type: 'number', default: '1', desc: '步长' },
      { kind: 'prop', name: 'range', type: 'boolean', default: 'false', desc: '双端 range 模式' },
      { kind: 'prop', name: 'showValue', type: 'boolean', default: 'false', desc: '显示当前值' },
      { kind: 'prop', name: 'disabled', type: 'boolean', default: 'false', desc: '禁用' },
      { kind: 'event', name: 'update:modelValue', type: 'number|[number,number]', default: '-', desc: 'v-model 更新事件' },
    ],
    examples: [
      {
        title: '单值滑条',
        desc: 'v-model 数字，showValue 显示当前值。',
        code: `<UiSlider v-model="volume" label="音量" :min="0" :max="100" show-value />`,
      },
      {
        title: '双端 range',
        desc: 'range 模式 v-model 双端数组，价格/区间选择。',
        code: `<UiSlider v-model="price" label="价格范围" :min="0" :max="200" :step="10" range show-value />`,
      },
    ],
  },

  {
    id: 'input-number',
    name: 'UiInputNumber',
    cn: '数字输入框',
    category: '表单',
    tagline: '数字步进输入，长按加速 + min/max 约束',
    desc: [
      '数字输入：defineModel<number|null> 支持空值，方向可控。步进按钮 ▲▼ + 长按自动加速（首次 400ms 后每隔 80ms，随步数加速至 x5）。',
      'min/max/step 约束 + 失焦钳制：blur 时把值回弹到合法范围，无需用户手调。',
      '直接输入数字/小数/负数，非法输入自动回退到上次合法值；Enter 提交，空/半成品置 null。',
      'label / error 提示 / disabled / 前缀插槽，与 UiInput 风格统一。precision 控制小数位。',
    ],
    learned: ['defineModel<number|null> 空态设计', '长按步进加速（定时器递增加速）', 'blur 钳制 + 非法输入回退', '受控/非受控 + placeholder/disabled', 'onBeforeUnmount 清理定时器'],
    api: [
      { kind: 'prop', name: 'modelValue', type: 'number|null', default: 'null', desc: 'v-model: 数字或空' },
      { kind: 'prop', name: 'label', type: 'string', default: "''", desc: '标签' },
      { kind: 'prop', name: 'error', type: 'string', default: "''", desc: '错误提示' },
      { kind: 'prop', name: 'placeholder', type: 'string', default: "''", desc: '占位符' },
      { kind: 'prop', name: 'disabled', type: 'boolean', default: 'false', desc: '禁用' },
      { kind: 'prop', name: 'min', type: 'number', default: '-Infinity', desc: '最小值' },
      { kind: 'prop', name: 'max', type: 'number', default: 'Infinity', desc: '最大值' },
      { kind: 'prop', name: 'step', type: 'number', default: '1', desc: '步长' },
      { kind: 'prop', name: 'precision', type: 'number', default: '0', desc: '小数位（>0 时四舍五入）' },
      { kind: 'prop', name: 'showControls', type: 'boolean', default: 'true', desc: '是否显示步进按钮' },
      { kind: 'event', name: 'update:modelValue', type: 'number|null', default: '-', desc: 'v-model 更新事件' },
      { kind: 'event', name: 'change', type: 'number|null', default: '-', desc: '失焦/提交时触发（最终值）' },
    ],
    examples: [
      {
        title: '基础数量',
        desc: 'v-model 数字，步进按钮加减。',
        code: `<UiInputNumber v-model="count" label="数量" :min="0" :max="99" />`,
      },
      {
        title: '精确小数',
        desc: 'precision=2 保留两位小数，步长 0.5。',
        code: `<UiInputNumber v-model="price" label="金额" :min="0" :step="0.5" :precision="2" />`,
      },
    ],
  },

  // ================= 反馈 =================
  {
    id: 'modal',
    name: 'UiModal',
    cn: '模态框',
    category: '反馈',
    tagline: 'Teleport 弹层 + v-model + 命令式控制',
    desc: [
      '对话框组件。<Teleport to="body"> 把弹层传送到 body 顶层，脱离父级样式/定位上下文限制。',
      'v-model 双向控制开合，也可通过 defineExpose 的 open()/close() 命令式调用。',
      '关闭方式：点遮罩、✕、Esc 键、关闭按钮；打开时自动锁定 body 滚动，带过渡动画。',
    ],
    learned: ['Teleport 传送到 body 顶层', 'v-model（modelValue + update:modelValue）', 'Transition 过渡动画', 'defineExpose 命令式 API', 'watch 锁定 body 滚动'],
    api: [
      { kind: 'prop', name: 'modelValue', type: 'boolean', default: 'false', desc: '是否显示（v-model）' },
      { kind: 'prop', name: 'title', type: 'string', default: "''", desc: '标题' },
      { kind: 'prop', name: 'width', type: 'string', default: `'480px'`, desc: '宽度（480px / 60%）' },
      { kind: 'prop', name: 'maskClosable', type: 'boolean', default: 'true', desc: '点遮罩是否可关闭' },
      { kind: 'slot', name: 'default', type: '-', default: '-', desc: '弹窗内容' },
      { kind: 'slot', name: 'footer', type: '-', default: '-', desc: '底部操作区' },
      { kind: 'event', name: 'update:modelValue', type: 'boolean', default: '-', desc: 'v-model 更新事件' },
      { kind: 'event', name: 'close', type: '-', default: '-', desc: '关闭时触发' },
    ],
    examples: [
      {
        title: 'v-model 控制',
        desc: '用 v-model 控制开合，footer 放操作按钮。',
        code: `<UiModal v-model="show" title="示例弹窗" width="420px">
  <p>这是一个 v-model 控制的模态框，内部用 Teleport 传送到 body。</p>
  <template #footer>
    <UiButton variant="ghost" @click="show = false">取消</UiButton>
    <UiButton @click="show = false">确认</UiButton>
  </template>
</UiModal>`,
      },
    ],
  },
  {
    id: 'toast',
    name: 'UiToast',
    cn: '消息提示',
    category: '反馈',
    tagline: '全局消息，命令式 $toast / useToast()',
    desc: [
      '右下角堆叠的全局消息提示。支持 success / error / info 三种类型，自动过期消失。',
      '命令式 API：模板里用 $toast.success(\'xxx\')，组合式里用 useToast()。安装 UiKit 时自动挂载隐藏 Toast 宿主。',
    ],
    learned: ['useToast() 命令式 API', 'reactive 数组管理多条消息 + 定时移除', 'app.config.globalProperties 挂载 $toast', 'defineExpose 暴露 show()'],
    api: [
      { kind: 'prop', name: 'type', type: `'success' | 'error' | 'info'`, default: '-', desc: '消息类型（命令式 push 传入）' },
      { kind: 'prop', name: 'message', type: 'string', default: '-', desc: '消息内容（命令式 push 传入）' },
      { kind: 'prop', name: 'duration', type: 'number', default: '2600', desc: '自动消失毫秒数' },
      { kind: 'event', name: '(via API)', type: 'push()', default: '-', desc: '命令式 $toast.push(type, msg, duration)' },
    ],
    examples: [
      {
        title: '命令式调用',
        desc: '全局 $toast 提供 success/error/info 三种快捷方法。',
        code: `<UiButton variant="secondary" @click="$toast.success('操作成功！')">成功</UiButton>
<UiButton variant="danger" @click="$toast.error('出错了，请重试')">错误</UiButton>
<UiButton @click="$toast.info('这是一条普通信息')">信息</UiButton>`,
      },
    ],
  },
  {
    id: 'progress',
    name: 'UiProgress',
    cn: '进度条',
    category: '反馈',
    tagline: '进度条，数值钳制 + 过渡动画',
    desc: [
      '横向进度条。value 为 0~100，内部 computed 钳制越界值。',
      'showText 显示百分比文字；color / height 自定义外观；数值变化带 width 过渡动画。',
    ],
    learned: ['computed 样式绑定 + 数值钳制', 'Transition 进度动画'],
    api: [
      { kind: 'prop', name: 'value', type: 'number', default: '-', desc: '进度值（0~100，自动钳制）' },
      { kind: 'prop', name: 'showText', type: 'boolean', default: 'false', desc: '显示百分比文字' },
      { kind: 'prop', name: 'color', type: 'string', default: `'#4f8cff'`, desc: '进度条颜色' },
      { kind: 'prop', name: 'height', type: 'number', default: '8', desc: '条的高度（px）' },
    ],
    examples: [
      {
        title: '基础用法',
        desc: '带文字、自定义颜色与高度的进度条。',
        code: `<UiProgress :value="30" show-text />
<UiProgress :value="55" color="#22c55e" :height="12" />
<UiProgress :value="80" color="#f59e0b" show-text />`,
      },
    ],
  },

  // ================= 布局 =================
  {
    id: 'container',
    name: 'UiContainer',
    cn: '内容容器',
    category: '布局',
    tagline: '限制最大宽度并水平居中',
    desc: [
      '内容容器。width 提供 sm/md/lg/xl/full 预设档位或任意 CSS 值，限制最大宽度并水平居中。',
      'padding 控制水平内边距（数字=px），移动端自动减小；纯 CSS 实现，零 JS 逻辑。',
    ],
    learned: ['纯 CSS 布局容器', 'width 档位 + 任意 CSS 值', '响应式内边距'],
    api: [
      { kind: 'prop', name: 'width', type: `'sm' | 'md' | 'lg' | 'xl' | 'full' | string`, default: `'lg'`, desc: '宽度档位或任意 CSS 值' },
      { kind: 'prop', name: 'padding', type: 'number | string', default: '24', desc: '水平内边距（数字=px）' },
      { kind: 'prop', name: 'fluid', type: 'boolean', default: 'false', desc: '铺满但限制最大宽度' },
      { kind: 'slot', name: 'default', type: '-', default: '-', desc: '容器内容' },
    ],
    examples: [
      {
        title: '基础用法',
        desc: '不同宽度档位的内容容器。',
        code: `<UiContainer width="md" padding="16">
  <p>md 档位，水平内边距 16px</p>
</UiContainer>
<UiContainer width="xl">
  <p>xl 档位，最大宽度 1280px</p>
</UiContainer>`,
      },
    ],
  },
  {
    id: 'grid',
    name: 'UiGrid + UiGridItem',
    cn: '响应式栅格',
    category: '布局',
    tagline: '12 栏栅格 + 断点响应式（md/lg/xl）',
    desc: [
      'CSS Grid 12 列栅格骨架。UiGrid 提供容器（cols/gap/对齐），UiGridItem 用 span 控制跨列，md/lg/xl 断点覆盖默认 span 实现响应式。',
      'provide/inject 把列数下发给 item；纯 CSS 媒体查询实现响应式，零 JS。',
    ],
    learned: ['CSS Grid 12 列栅格', '断点体系（sm/md/lg/xl）', 'provide/inject 下发断点信息', '--ui-span CSS 变量响应式'],
    api: [
      { kind: 'prop', name: 'cols', type: 'number', default: '12', desc: '每行总列数' },
      { kind: 'prop', name: 'gap', type: 'number | string', default: '16', desc: '栅格间距' },
      { kind: 'prop', name: 'rowGap', type: 'number | string', default: '-', desc: '行间距（默认同 gap）' },
      { kind: 'prop', name: 'align', type: `'start'|'center'|'end'|'stretch'|'baseline'`, default: `'stretch'`, desc: '垂直对齐' },
      { kind: 'prop', name: 'justify', type: `'start'|'center'|'end'|'between'|'around'|'evenly'`, default: `'start'`, desc: '主轴对齐' },
      { kind: 'slot', name: 'default', type: '-', default: '-', desc: 'UiGridItem 列表' },
    ],
    examples: [
      {
        title: '响应式栅格',
        desc: 'GridItem 默认占 6 列，lg 断点占 3 列（一行四个）。',
        code: `<UiGrid :gap="12">
  <UiGridItem :span="6" :lg="3"><div class="cell">A</div></UiGridItem>
  <UiGridItem :span="6" :lg="3"><div class="cell">B</div></UiGridItem>
  <UiGridItem :span="6" :lg="3"><div class="cell">C</div></UiGridItem>
  <UiGridItem :span="6" :lg="3"><div class="cell">D</div></UiGridItem>
</UiGrid>`,
      },
    ],
  },
  {
    id: 'spacer',
    name: 'UiSpacer',
    cn: '间距占位',
    category: '布局',
    tagline: '垂直/水平留白，通用间距 token',
    desc: [
      '留白占位组件。size 提供 xs/sm/md/lg/xl/xxl 档位或任意像素值，axis 控制垂直/水平方向。',
      '用 CSS 变量 --ui-sp 输出尺寸，纯 CSS 实现。',
    ],
    learned: ['垂直/水平留白抽象', 'size 档位 + 任意像素值', 'CSS 变量输出尺寸'],
    api: [
      { kind: 'prop', name: 'size', type: `'xs'|'sm'|'md'|'lg'|'xl'|'xxl'|number`, default: `'md'`, desc: '间距档位或像素值' },
      { kind: 'prop', name: 'axis', type: `'vertical' | 'horizontal'`, default: `'vertical'`, desc: '留白方向' },
    ],
    examples: [
      {
        title: '纵向/横向留白',
        desc: '不同档位的间距占位。',
        code: `<div class="row">
  <UiButton>上</UiButton>
</div>
<UiSpacer size="lg" />
<div class="row">
  <UiButton>下（间隔 24px）</UiButton>
  <UiSpacer axis="horizontal" size="sm" />
  <UiButton>横</UiButton>
</div>`,
      },
    ],
  },

  // ================= 数据 =================
  {
    id: 'virtual',
    name: 'UiVirtualList',
    cn: '虚拟列表',
    category: '数据',
    tagline: '固定 + 动态行高双模式，5 万条丝滑渲染',
    desc: [
      '高性能虚拟滚动列表。只渲染视口内的行（20~30 个 DOM），配合占位 div 撑起真实总高，滚动条比例真实。',
      '固定行高模式：scrollTop ÷ rowHeight O(1) 定位；动态行高模式：估算占位 + 偏移缓存 + 二分查找，滚到哪测到哪。',
      '泛型组件 generic="T" 让 slot 的 item 类型推导完整；rAF 节流滚动；ResizeObserver 自适应；overscan 防露白。',
    ],
    learned: ['滑动窗口算法 + 占位撑总高', 'dynamic: 估算占位 + 偏移缓存 + 二分查找', '泛型组件 generic="T"', 'rAF 节流 + ResizeObserver', 'overscan 防露白'],
    api: [
      { kind: 'prop', name: 'items', type: 'T[]', default: '-', desc: '数据列表' },
      { kind: 'prop', name: 'rowHeight', type: 'number', default: '-', desc: '固定模式行高（px）' },
      { kind: 'prop', name: 'variable', type: 'boolean', default: 'false', desc: '动态行高模式' },
      { kind: 'prop', name: 'estimatedRowHeight', type: 'number', default: '-', desc: '动态模式估算行高（px）' },
      { kind: 'prop', name: 'overscan', type: 'number', default: '3', desc: '视口外多渲染行数（防露白）' },
      { kind: 'slot', name: 'default', type: '{item,index,measure?}', default: '-', desc: '行内容；动态模式额外提供 measure ref 回调' },
      { kind: 'event', name: '(expose)', type: 'refresh()', default: '-', desc: 'defineExpose 暴露手动刷新重测' },
    ],
    examples: [
      {
        title: '固定行高',
        desc: '5 万条数据，只渲染视口内约 20~30 个 DOM。',
        code: `<UiVirtualList
  :items="items" :row-height="56" :overscan="3"
  style="height: 400px">
  <template #default="{ item, index }">
    <div class="row">#{{ index }} - {{ item.title }}</div>
  </template>
</UiVirtualList>`,
      },
      {
        title: '动态行高',
        desc: '内容长短不一 / 可展开收起的高动态列表，variable 模式自动测量。',
        code: `<UiVirtualList
  :items="items" variable :estimated-row-height="48"
  style="height: 400px">
  <template #default="{ item, index, measure }">
    <div :ref="measure" class="dynamic-row">
      {{ item.text }}（高度自适应）
    </div>
  </template>
</UiVirtualList>`,
      },
    ],
  },

  // ================= 数据 =================
  {
    id: 'table',
    name: 'UiTable',
    cn: '数据表格',
    category: '数据',
    tagline: '列配置驱动 + 排序 + 分页 + 作用域插槽 + 表头固定 + 多选 + 列宽拖动',
    desc: [
      '企业级数据表格。列配置（columns）驱动渲染，一行配置即可出表，业务代码零模板重复。',
      '排序：点击表头循环 asc→desc→none（不可变数据更新），支持数字/字符串(中文 locale)/日期比较，也可受控（sortKey/sortOrder + update 事件）。',
      '分页：pageSize>0 时内置分页控件，computed 切片当前页数据，排序结果分页联动。',
      '表头固定：stickyHeader + maxHeight 让容器受限滚动，表头 position:sticky 吸附顶部（需不透明背景遮住透出内容）。',
      '多选：selectable + rowKey 开启行选择，表头 checkbox 全选当前页（跨页保留已选）、半选态、行高亮，v-model:selected 受控或内部非受控。',
      '列宽拖动：resizable 开启后表头右侧有拖拽手柄，可调列宽（受控 columnWidths 或非受控），minColWidth 防止拖太窄。',
      '作用域插槽 #cell（row/column/index/value）优先于 formatter 自定义单元格；自带空态/加载态（含旋转动画）/斑马纹/紧凑模式。',
    ],
    learned: ['列配置驱动渲染（数据即视图）', '排序状态受控/非受控双模式（内部 ref vs props 受控）', 'computed 不可变排序 + 分页切片联动', 'position:sticky 表头固定（滚动容器内吸附，需不透明背景）', '多选：Set 管理选中集，表头全选当前页 + 半选态（indeterminate）', '列宽拖动：mousedown 记录起点 → document mousemove 算 delta，全局监听 + 卸载清理；受控/非受控双模式', '作用域插槽 + formatter 双通道自定义单元格', 'colspan 空态/加载态行'],
    api: [
      { kind: 'prop', name: 'columns', type: 'TableColumn[]', default: '-', desc: '列配置（key/label/width/align/sortable/formatter）' },
      { kind: 'prop', name: 'data', type: 'any[]', default: '-', desc: '数据行' },
      { kind: 'prop', name: 'pageSize', type: 'number', default: '10', desc: '分页大小；<=0 不分页' },
      { kind: 'prop', name: 'loading', type: 'boolean', default: 'false', desc: '加载态（显示旋转动画）' },
      { kind: 'prop', name: 'emptyText', type: 'string', default: '暂无数据', desc: '空态文案' },
      { kind: 'prop', name: 'striped', type: 'boolean', default: 'false', desc: '斑马纹' },
      { kind: 'prop', name: 'dense', type: 'boolean', default: 'false', desc: '紧凑模式' },
      { kind: 'prop', name: 'stickyHeader', type: 'boolean', default: 'false', desc: '表头固定（需配合 maxHeight）' },
      { kind: 'prop', name: 'maxHeight', type: 'string', default: "'300px'", desc: '表头固定时滚动容器最大高度' },
      { kind: 'prop', name: 'selectable', type: 'boolean', default: 'false', desc: '开启行选择（多选）' },
      { kind: 'prop', name: 'rowKey', type: 'string', default: "'key'", desc: '行的唯一标识字段（多选必填）' },
      { kind: 'prop', name: 'selected', type: '(string\|number)[]', default: '[]', desc: '已选行 key 列表（受控）' },
      { kind: 'prop', name: 'resizable', type: 'boolean', default: 'false', desc: '开启列宽拖动' },
      { kind: 'prop', name: 'columnWidths', type: 'Record<string,number>', default: '{}', desc: '列宽表（受控，key → 像素宽）' },
      { kind: 'prop', name: 'minColWidth', type: 'number', default: '60', desc: '拖拽列最小宽（px）' },
      { kind: 'prop', name: 'sortKey / sortOrder', type: 'string / SortOrder', default: '-', desc: '受控排序状态（外部控制时传）' },
      { kind: 'slot', name: 'cell', type: '{row,column,index,value}', default: '-', desc: '自定义单元格（优先于 formatter）' },
      { kind: 'event', name: 'update:sortKey', type: '(key)', default: '-', desc: '排序字段变化' },
      { kind: 'event', name: 'update:sortOrder', type: '(order)', default: '-', desc: '排序方向变化' },
      { kind: 'event', name: 'update:currentPage', type: '(page)', default: '-', desc: '页码变化' },
      { kind: 'event', name: 'update:selected', type: '(keys)', default: '-', desc: '选中集变化' },
      { kind: 'event', name: 'update:columnWidths', type: '(widths)', default: '-', desc: '列宽表变化' },
    ],
    examples: [
      {
        title: '排序 + 分页',
        desc: '列配置驱动，年龄列可排序，每页 3 条内置分页。',
        code: `<UiTable
  :columns="[
    { key: 'name', label: '姓名', sortable: true },
    { key: 'age', label: '年龄', sortable: true, align: 'right' },
    { key: 'city', label: '城市' },
  ]"
  :data="rows" :page-size="3" />`,
      },
      {
        title: '表头固定',
        desc: 'stickyHeader 让表头在受限高度内滚动时吸附顶部。',
        code: `<UiTable :columns="cols" :data="rows" sticky-header max-height="320px" />`,
      },
      {
        title: '多选（行选择）',
        desc: 'rowKey 指定行唯一键，v-model:selected 受控选中集；表头全选当前页，跨页保留已选。',
        code: `<UiTable
  :columns="cols"
  :data="rows"
  selectable
  row-key="id"
  v-model:selected="selected"
/>`,
      },
      {
        title: '列宽拖动',
        desc: 'resizable 开启拖拽手柄，v-model:column-widths 受控列宽，min-col-width 限最小宽。',
        code: `<UiTable
  :columns="cols"
  :data="rows"
  resizable
  v-model:column-widths="widths"
  min-col-width="80"
/>`,
      },
      {
        title: '作用域插槽自定义单元格',
        desc: '#cell 拿到 row/column/value，渲染任意内容（动画、徽标、按钮）。',
        code: `<UiTable :columns="cols" :data="rows">
  <template #cell="{ column, value }">
    <UiBadge v-if="column.key === 'status'" :color="value ? 'green' : 'gray'">
      {{ value ? '启用' : '停用' }}
    </UiBadge>
    <span v-else>{{ value }}</span>
  </template>
</UiTable>`,
      },
    ],
  },

  // ================= 日期选择器（作品㉘） =================
  {
    id: 'datepicker',
    name: 'UiDatePicker',
    cn: '日期选择器',
    category: '数据',
    tagline: '日历弹层选择 + 手动输入 + 禁用范围 + 快捷选项',
    desc: [
      '完整的日期选择器：点击输入框或日历图标弹出日历面板，点选日期即可 v-model 绑定 YYYY-MM-DD 字符串。',
      '日历网格算法：年/月切换（跨年自动处理）、闰年判断、当月天数 + 上/下月补位成 42 格；今天高亮、选中高亮、悬停反馈。',
      '双通道输入：日历点选 + 输入框手动输入（input 事件解析校验），双向同步。',
      'min/max 禁用边界日期；showShortcuts 快捷选项（今天/昨天）；外部点击自动关闭（v-click-outside）。',
    ],
    learned: ['defineModel 绑定日期字符串', '日历网格算法（年月切换/闰年/补位42格）', '弹层 + v-click-outside 点外关闭', '受控输入 + 日历点选双向同步', 'min/max 禁用 + 今天/选中/悬停高亮态'],
    api: [
      { kind: 'prop', name: 'modelValue', type: 'string', default: "''", desc: 'v-model 绑定日期 YYYY-MM-DD' },
      { kind: 'prop', name: 'label', type: 'string', default: "''", desc: '字段标签' },
      { kind: 'prop', name: 'placeholder', type: 'string', default: "'选择日期'", desc: '输入框占位' },
      { kind: 'prop', name: 'disabled', type: 'boolean', default: 'false', desc: '禁用' },
      { kind: 'prop', name: 'error', type: 'string', default: "''", desc: '错误提示（红框）' },
      { kind: 'prop', name: 'min / max', type: 'string', default: "''", desc: '可选的日期范围边界（YYY-MM-DD）' },
      { kind: 'prop', name: 'showShortcuts', type: 'boolean', default: 'false', desc: '显示快捷选项（今天/昨天）' },
      { kind: 'event', name: 'update:modelValue', type: '(string)', default: '-', desc: '选择日期时触发' },
    ],
    examples: [
      {
        title: '基础用法',
        desc: 'v-model 绑定日期字符串，点击图标弹出日历。',
        code: `<UiDatePicker v-model="date" label="开始日期" />`,
      },
      {
        title: '限制范围 + 快捷选项',
        desc: 'min/max 限制可选范围，showShortcuts 提供今天/昨天快捷选择。',
        code: `<UiDatePicker
  v-model="date"
  min="2026-01-01"
  max="2026-12-31"
  show-shortcuts
  placeholder="选择日期" />`,
      },
    ],
  },

  // ================= 通用（作品㉙ · 标签页） =================
  {
    id: 'tabs',
    name: 'UiTabs + UiTabPanel',
    cn: '标签页',
    category: '通用',
    tagline: 'v-model 标签页，数据驱动 + 键盘无障碍 + 滑动指示器 + 面板解耦',
    desc: [
      '通用标签页组件。tabs 数据驱动渲染标签条，配合 UiTabPanel 声明面板内容。',
      '标签与面板彻底解耦：UiTabs 只管 tabs 数组和标签条，UiTabPanel 通过 provide/inject 拿到激活态自动联动显隐，面板无需知道 tabs 数组。',
      '双通道激活态：v-model 受控（modelValue）+ defaultActive 非受控初始值。',
      '键盘无障碍：role=tablist/tab/tabpanel + 方向键切换 + Home/End 到头尾 + aria-selected，焦点跟随激活项。',
      '两种风格：line（下划线滑动指示器，平滑跟随激活项）+ card（卡片）。UiTabPanel 支持 lazy 懒挂载 + 淡入淡出切换动画。',
    ],
    learned: [
      'provide/inject 实现面板与标签解耦联动',
      '受控/非受控双通道（modelValue vs internal ref）',
      '键盘无障碍（tablist/tab/tabpanel + 方向键 + roving tabindex）',
      '下划线指示器：querySelector 实测 offsetLeft/offsetWidth + nextTick 布局后定位',
      'Transition mode=out-in 面板切换动画',
      'lazy 懒挂载（首次激活才渲染面板内容）',
      '可关闭 tab + 动态增删校准（close emit + active 自动回退）',
    ],
    api: [
      { kind: 'prop', name: 'tabs', type: 'UiTabItem[]', default: '-', desc: '标签数据（label/value/disabled/closable?）' },
      { kind: 'prop', name: 'modelValue', type: 'string \| number', default: '-', desc: 'v-model 激活项 value（受控）' },
      { kind: 'prop', name: 'defaultActive', type: 'string \| number', default: 'tabs[0].value', desc: '非受控初始激活项' },
      { kind: 'prop', name: 'type', type: `'line' \| 'card'`, default: `'line'`, desc: '样式变体' },
      { kind: 'prop', name: 'animated', type: 'boolean', default: 'true', desc: '面板切换动画开关' },
      { kind: 'prop', name: 'closable', type: 'boolean', default: 'false', desc: '是否显示关闭按钮（单 tab closable 字段优先）' },
      { kind: 'slot', name: 'default', type: '-', default: '-', desc: '放置 UiTabPanel 面板' },
      { kind: 'event', name: 'update:modelValue', type: '(value)', default: '-', desc: '激活项变化（受控）' },
      { kind: 'event', name: 'change', type: '(value)', default: '-', desc: '激活项变化（受控与非受控都触发）' },
      { kind: 'event', name: 'close', type: '(value)', default: '-', desc: '点击 tab 关闭按钮（父组件删除该 tab，删当前项时自动切相邻）' },
    ],
    examples: [
      {
        title: '基础标签页',
        desc: 'tabs 数据驱动 + UiTabPanel 声明面板，name 与 value 对应。',
        code: `<UiTabs
  :tabs="[
    { label: '简介', value: 'about' },
    { label: '成员', value: 'team' },
    { label: '设置', value: 'settings' },
  ]">
  <UiTabPanel name="about">这是简介面板。</UiTabPanel>
  <UiTabPanel name="team">这是成员面板。</UiTabPanel>
  <UiTabPanel name="settings">这是设置面板。</UiTabPanel>
</UiTabs>`,
      },
      {
        title: '禁用项 + 非受控初始值',
        desc: 'disabled 的 tab 不可选中；defaultActive 指定初始激活项。',
        code: `<UiTabs
  :tabs="[
    { label: '已启用', value: 'on' },
    { label: '已禁用', value: 'off', disabled: true },
  ]"
  default-active="on" />`,
      },
      {
        title: '卡片风格 + v-model',
        desc: 'type=card 卡片式标签，v-model 受控绑定当前项。',
        code: `<UiTabs v-model="active" type="card"
  :tabs="[
    { label: '标签一', value: 1 },
    { label: '标签二', value: 2 },
  ]">
  <UiTabPanel :name="1">一号面板</UiTabPanel>
  <UiTabPanel :name="2">二号面板</UiTabPanel>
</UiTabs>`,
      },
      {
        title: '可关闭 + 动态增删（作品㉚ 进阶）',
        desc: 'closable 显示 ✕，点击 emit close（父组件删除该 tab，删当前项自动切相邻）；tabs 变化后 active 不存在会自动校准。',
        code: `<UiTabs
  :tabs="tabs"
  v-model="active"
  closable
  type="card"
  @close="tabs = tabs.filter(t => t.value !== $event)">
  <UiTabPanel v-for="t in tabs" :key="t.value" :name="t.value">
    面板内容 {{ t.label }}
  </UiTabPanel>
</UiTabs>

<!-- 新增标签：直接 push 到 tabs，active 自动跟随 -->
<UiButton @click="addTab">＋ 新增</UiButton>`,
      },
    ],
  },

  // ================= 通用（进阶：provide/inject） =================
  {
    id: 'config-provider',
    name: 'UiConfigProvider',
    cn: '全局配置提供者',
    category: '通用',
    tagline: '用 provide/inject 向组件树注入库级配置，无需逐层 props 透传。',
    desc: [
      '作品㉑ 进阶特性：provide/inject 全局配置系统。',
      '通过 <UiConfigProvider> 在组件树顶层注入一份响应式配置（tooltip 延迟/方向、动画开关），任何后代组件用 useUiConfig() 直接读取，无需逐层传 props。',
      '支持就近覆盖：内层 Provider 会覆盖外层同 key 的配置。注入给子树的配置是只读的，防止不小心改掉全局设置。',
      '配套还有 vTooltip / vAutoFocus 两个自定义指令（同属作品㉑）。',
    ],
    learned: [
      'provide / inject —— 跨层级传配置，摆脱 prop 逐层透传的样板代码',
      'InjectionKey —— 类型安全的注入键（Symbol），字符串 key 易拼错',
      'inject 带默认值 —— 未包 Provider 也能用，不会报错',
      'readonly —— 注入子树的是只读视图，防子组件篡改全局配置',
    ],
    api: [
      { kind: 'prop', name: 'tooltipDelay', type: 'number', default: '300', desc: 'tooltip 显示延迟（毫秒）' },
      { kind: 'prop', name: 'tooltipPlacement', type: `'top' | 'bottom' | 'left' | 'right'`, default: "'top'", desc: 'tooltip 默认方向' },
      { kind: 'prop', name: 'animated', type: 'boolean', default: 'true', desc: '是否启用动画过渡' },
      { kind: 'slot', name: 'default', type: '-', default: '-', desc: '被配置包裹的组件树（Provider 本身不渲染 DOM）' },
    ],
    examples: [
      {
        title: '包裹子树提供配置',
        desc: '在其内部，任何组件 useUiConfig() 都能拿到这份配置（这里让 tooltip 改为底部、延迟 800ms）。',
        code: `<UiConfigProvider :tooltip-placement="'bottom'" :tooltip-delay="800">
  <UiButton v-tooltip="'底部提示'">按钮</UiButton>
</UiConfigProvider>`,
      },
      {
        title: '就近覆盖',
        desc: '内层 Provider 会覆盖外层同 key 的配置（这里是 tooltipDelay 被改为 900）。',
        code: `<UiConfigProvider :tooltip-delay="500">
  <UiConfigProvider :tooltip-delay="900">
    <UiButton v-tooltip="'900ms 生效'">内层</UiButton>
  </UiConfigProvider>
</UiConfigProvider>`,
      },
    ],
  },

  // ================= 树形（作品㊱） =================
  {
    id: 'tree',
    name: 'UiTree',
    cn: '树形控件',
    category: '数据',
    tagline: '递归树 + 展开/折叠 + 父子选中联动 + 懒加载 + 过滤',
    desc: [
      '企业级树形控件。data 数据驱动递归渲染，用于菜单 / 部门组织 / 权限树等层级结构。',
      '选中联动：checkable 开启复选框，默认父子联动（勾选父 → 后代全选；子部分勾选 → 父半选态 indeterminate；子全选 → 父自动选）；checkStrictly 可切换严格模式（父子互不影响）。',
      '懒加载：load 回调在展开时按需异步加载子节点，loading 态自动出现；isLeaf 可强制某节点为叶（不展开）。',
      '过滤：filterText 关键字匹配节点，命中节点及其祖先强制展开显示，命中 label 高亮。',
      '单选：selectable 点击节点高亮选中（互斥）并 emit select / node-click。',
    ],
    learned: ['递归渲染（UiTreeNode 自引用 + provide/inject 共享树上下文）', '父子选中联动：勾选祖先+后代、取消祖先链、半选态（indeterminate）计算', '受控/非受控双模式（expandedKeys / checkedKeys）', '懒加载：展开时调 load 变异 node.children + loadingKeys 管理', '过滤：匹配集 + 祖先集，命中节点及其祖先强制展开', '<script setup> 不能 export 上下文 → InjectionKey 抽独立 treeContext.ts'],
    api: [
      { kind: 'prop', name: 'data', type: 'TreeNode[]', default: '-', desc: '树数据（label/value/children/disabled/expanded/checked/isLeaf）' },
      { kind: 'prop', name: 'selectable', type: 'boolean', default: 'true', desc: '节点单选（点击高亮）' },
      { kind: 'prop', name: 'checkable', type: 'boolean', default: 'false', desc: '显示复选框（可多选）' },
      { kind: 'prop', name: 'checkStrictly', type: 'boolean', default: 'false', desc: '严格模式：父子选中互不影响' },
      { kind: 'prop', name: 'defaultExpandAll', type: 'boolean', default: 'false', desc: '默认全部展开' },
      { kind: 'prop', name: 'defaultExpandedKeys', type: '(string\|number)[]', default: '[]', desc: '默认展开节点（非受控）' },
      { kind: 'prop', name: 'expandedKeys', type: '(string\|number)[]', default: '-', desc: '受控展开集合' },
      { kind: 'prop', name: 'checkedKeys', type: '(string\|number)[]', default: '-', desc: '受控选中集合' },
      { kind: 'prop', name: 'filterText', type: 'string', default: "''", desc: '关键字过滤（命中高亮且祖先展开）' },
      { kind: 'prop', name: 'showLine', type: 'boolean', default: 'false', desc: '显示树形连接线' },
      { kind: 'prop', name: 'load', type: '(node) => Promise<TreeNode[]>', default: '-', desc: '懒加载回调（展开时按需加载子节点）' },
      { kind: 'event', name: 'update:expandedKeys', type: '(keys)', default: '-', desc: '展开集合变化（受控）' },
      { kind: 'event', name: 'update:checkedKeys', type: '(keys)', default: '-', desc: '选中集合变化（受控）' },
      { kind: 'event', name: 'select', type: '(node, selected)', default: '-', desc: '单选变化' },
      { kind: 'event', name: 'check', type: '(keys, node, checked)', default: '-', desc: '勾选变化' },
      { kind: 'event', name: 'node-click', type: '(node)', default: '-', desc: '点击节点' },
      { kind: 'event', name: 'node-expand / node-collapse', type: '(node)', default: '-', desc: '展开 / 折叠' },
    ],
    examples: [
      {
        title: '基础树 + 默认展开',
        desc: '数据驱动渲染，defaultExpandAll 全部展开。',
        code: `<UiTree :data="tree" default-expand-all />`,
      },
      {
        title: '父子选中联动',
        desc: 'checkable 开启复选框；勾选父节点自动全选后代，子部分勾选时父半选。',
        code: `<UiTree :data="tree" checkable default-expand-all />`,
      },
      {
        title: '严格模式',
        desc: 'checkStrictly 让父子勾选互不影响，适合权限点独立管理的场景。',
        code: `<UiTree :data="tree" checkable check-strictly />`,
      },
      {
        title: '懒加载',
        desc: 'load 在展开时异步加载子节点；isLeaf 节点不显示展开箭头。',
        code: `<UiTree :data="roots" :load="loadChildren" />`,
      },
      {
        title: '过滤',
        desc: 'filterText 输入关键字，命中节点及其祖先强制展开显示并高亮。',
        code: `<UiTree :data="tree" :filter-text="keyword" />`,
      },
    ],
  },
]

// ---------- 分类索引 ----------
export const categories = ['通用', '表单', '反馈', '布局', '数据'] as const

export function getDoc(id: string): ComponentDoc | undefined {
  return docs.find((d) => d.id === id)
}

/** props / slots / events 分组 */
export function groupApi(api: ApiRow[]) {
  return {
    props: api.filter((r) => r.kind === 'prop'),
    slots: api.filter((r) => r.kind === 'slot'),
    events: api.filter((r) => r.kind === 'event'),
  }
}
