# MarkdownReader 演示

一个美观的 Windows Markdown 阅读器。欢迎使用！

## 文本样式

支持 **加粗**、*斜体*、~~删除线~~、`行内代码`、<kbd>Ctrl</kbd>+<kbd>F</kbd> 查找，以及 [超链接](https://example.com)。

> 这是一段引用文字。引用可以用来强调重要内容，
> 也可以跨多行。

## 列表

无序列表：

- 第一项
- 第二项
  - 嵌套项
  - 嵌套项
- 第三项

有序列表：

1. 步骤一
2. 步骤二
3. 步骤三

任务列表：

- [x] 已完成的功能
- [x] 代码高亮
- [ ] 待办事项

## 代码高亮

```javascript
function fibonacci(n) {
  if (n < 2) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
console.log(fibonacci(10));
```

```python
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))
```

## 表格

| 功能 | 支持 | 说明 |
|------|:----:|------|
| GFM | 是 | GitHub 风格 |
| 代码高亮 | 是 | highlight.js |
| 数学公式 | 是 | KaTeX |
| 图表 | 是 | Mermaid |

## 数学公式

行内公式 $E = mc^2$ 与块级公式：

$$
\frac{n!}{k!(n-k)!} = \binom{n}{k}
$$

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

## Mermaid 图表

```mermaid
graph LR
    A[开始] --> B{条件判断}
    B -->|是| C[执行]
    B -->|否| D[结束]
    C --> D
```

## 引用与分割线

上面是各种元素，下面是一条分割线。

---

文档结束。
