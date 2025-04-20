
# jquery的attr和prop有什么区别？




在 jQuery 1.6 以前，`.attr()` 就负责读写元素的大多数“状态”，但随着 HTML 属性（attribute）和 DOM 属性／特性（property）概念的日益分离，jQuery 从 1.6 起引入了 `.prop()`，专门用于操作 DOM 对象的原生属性。下面从几个角度来详细剖析两者的区别和使用场景。

---

## 1. 概念区分

| 概念     | HTML Attribute（属性）                                  | DOM Property（属性）                                    |
|---------|------------------------------------------------------|--------------------------------------------------------|
| 定义     | 写在标签上的 “静态” 属性，比如 `<input type="checkbox" checked>` 中的 `checked`。 | 浏览器在解析 HTML 后，为元素创建的 JavaScript 对象上的属性，比如 `el.checked`。 |
| 类型     | 字符串（string）                                       | 根据属性不同，可能是 Boolean、Number、对象等               |
| 生命周期 | 原始 HTML 中存在，除非手动操作元素的属性，否则不会随 DOM 变化自动更新。 | 随用户操作和脚本而动态变化，反映元素的当前状态。               |

---

## 2. `.attr()` 与 `.prop()` 的主要区别

1. **返回值类型不同**  
   - `.attr('foo')` 总是返回字符串（或 `undefined`/`null`），因为它对应的是 HTML 属性值。  
   - `.prop('foo')` 返回对应的原生属性类型，例如布尔、数字、对象等。

2. **读写的“层”不同**  
   - `.attr()` 操作的是元素的 **attribute**，即标签上声明或动态设置的属性。  
   - `.prop()` 操作的是元素的 **property**，即浏览器内部的 DOM 对象状态。

3. **布尔属性的处理**  
   HTML 有一些布尔属性（如 `checked`、`selected`、`disabled`、`readonly` 等），在 DOM 中对应的 property 都是布尔值。  
   ```html
   <input type="checkbox" id="chk" checked>
   ```
   ```js
   // jQuery
   $('#chk').attr('checked'); // => "checked"（字符串）
   $('#chk').prop('checked'); // => true（Boolean）

   // 用户手动取消勾选后：
   $('#chk').attr('checked'); // => "checked" （属性还在 HTML 上）
   $('#chk').prop('checked'); // => false   （DOM 状态已变）
   ```

4. **设置行为的差异**  
   - 对于布尔属性，`.attr('disabled', true)` 会在元素上写入 `disabled="true"`，而浏览器并不把 `"true"` 当做禁用；正确做法应是 `.prop('disabled', true)`。  
   - 如果你用 `.prop('checked', false)` 取消勾选，DOM 和界面都会更新；用 `.attr('checked', false)` 只是把属性写成 `checked="false"`（仍被视为存在该属性），并不会改变勾选状态。

---

## 3. 常见属性对比示例

| 用法                          | 结果（初始）               | 结果（用户改变后）                                   |
|------------------------------|----------------------------|-----------------------------------------------------|
| `$('#inp').attr('value')`    | 初始 HTML 中的 value 字符串 | 仍然是最初写在标签上的字符串，不随输入改变                |
| `$('#inp').prop('value')`    | 当前输入框的值（用户输入）   | 随用户输入实时变化                                     |
| `$('#opt').attr('selected')` | `"selected"` 或 `undefined` | 不随用户选中而变（依旧看 HTML）                         |
| `$('#opt').prop('selected')` | `true` / `false`           | 随用户选中实时反映                                     |

---

## 4. 使用建议

- **读取／修改状态（State）时**，优先使用 `.prop()`：  
  勾选框的 `checked`、下拉框的 `selectedIndex`、按钮的 `disabled`、输入框的 `value` 等。

- **读取／修改标签上声明的数据或自定义属性时**，仍用 `.attr()`：  
  `src`、`href`、`title`、`data-*`、`aria-*` 以及其他非布尔属性。

- **添加／移除属性**：  
  - `.attr('foo', 'bar')` 与 `.removeAttr('foo')`  
  - `.prop('foo', false)` 或直接设置 `.prop('foo', true)` 与 `.prop('foo', false)`

---

## 5. 版本兼容

- jQuery 1.6 及以上：区分 `.attr()` 和 `.prop()`；推荐针对不同场景选择合适方法。  
- jQuery 1.5 及以下：只有 `.attr()`，很多布尔属性操作会有坑，需要手动读写 DOM 属性 `el.checked = true/false`。

---

### 小结

> **`.attr()` 操作 HTML attribute（字符串层面）**  
> **`.prop()` 操作 DOM property（真实状态层面）**  

了解并区分这两者，可以避免对于布尔属性或动态状态属性的常见错误，更加准确地读写和控制元素。