/**
 * UI控制器 - 处理用户界面交互和SVG操作
 */

class UIController {
    constructor(logicCore) {
        this.logicCore = logicCore;
        this.svg = null;
        this.isDragging = false;
        this.dragElement = null;
        this.dragOffset = { x: 0, y: 0 };
        this.tooltip = null;
    }

    /**
     * 初始化UI控制器
     */
    init() {
        this.svg = document.getElementById('main-canvas');
        this.tooltip = document.getElementById('tooltip');
        this.setupEventListeners();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // SVG 点击事件
        this.svg.addEventListener('click', this.handleSVGClick.bind(this));
        
        // 鼠标拖拽事件
        this.svg.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.svg.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.svg.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // 阻止右键菜单
        this.svg.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // 鼠标悬停事件（用于提示）
        this.svg.addEventListener('mouseover', this.handleMouseOver.bind(this));
        this.svg.addEventListener('mouseout', this.handleMouseOut.bind(this));
    }

    /**
     * 渲染所有元素
     */
    render() {
        this.clearSVG();
        this.renderConnections();
        this.renderElements();
    }

    /**
     * 清空SVG内容（保留网格）
     */
    clearSVG() {
        // 移除所有非网格元素
        const elementsToRemove = this.svg.querySelectorAll('.logic-element, .connection-line');
        elementsToRemove.forEach(element => element.remove());
    }

    /**
     * 渲染连接线
     */
    renderConnections() {
        this.logicCore.connections.forEach(connection => {
            const line = this.createSVGElement('line', {
                class: 'connection-line',
                x1: connection.fromX,
                y1: connection.fromY,
                x2: connection.toX,
                y2: connection.toY,
                'data-connection-id': connection.id
            });
            
            this.svg.appendChild(line);
        });
    }

    /**
     * 渲染逻辑元素
     */
    renderElements() {
        this.logicCore.elements.forEach(element => {
            const group = this.createLogicElementGroup(element);
            this.svg.appendChild(group);
        });
    }

    /**
     * 创建逻辑元素组
     */
    createLogicElementGroup(element) {
        const group = this.createSVGElement('g', {
            class: `logic-element ${element.isSelected ? 'selected' : ''}`,
            'data-element-id': element.id,
            transform: `translate(${element.x}, ${element.y})`
        });

        // 创建矩形背景
        const rect = this.createSVGElement('rect', {
            class: 'element-rect',
            x: 0,
            y: 0,
            width: element.width,
            height: element.height,
            rx: 5,
            ry: 5
        });

        // 创建文本
        const text = this.createSVGElement('text', {
            class: 'element-text',
            x: element.width / 2,
            y: element.height / 2,
            'text-anchor': 'middle',
            'dominant-baseline': 'central'
        });
        text.textContent = element.text;

        group.appendChild(rect);
        group.appendChild(text);

        return group;
    }

    /**
     * 创建SVG元素
     */
    createSVGElement(tag, attributes) {
        const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        return element;
    }

    /**
     * 处理SVG点击事件
     */
    handleSVGClick(event) {
        const target = event.target.closest('.logic-element');
        
        if (target) {
            const elementId = parseInt(target.getAttribute('data-element-id'));
            this.logicCore.toggleSelection(elementId);
            this.render();
            this.updateOperatorButtonStates();
        } else {
            // 点击空白区域，清除选择
            this.logicCore.clearSelection();
            this.render();
            this.updateOperatorButtonStates();
        }
    }

    /**
     * 处理鼠标按下事件
     */
    handleMouseDown(event) {
        const target = event.target.closest('.logic-element');
        
        if (target) {
            this.isDragging = true;
            this.dragElement = target;
            
            const elementId = parseInt(target.getAttribute('data-element-id'));
            const element = this.logicCore.elements.find(e => e.id === elementId);
            
            if (element) {
                const rect = this.svg.getBoundingClientRect();
                this.dragOffset.x = event.clientX - rect.left - element.x;
                this.dragOffset.y = event.clientY - rect.top - element.y;
            }
            
            event.preventDefault();
        }
    }

    /**
     * 处理鼠标移动事件
     */
    handleMouseMove(event) {
        if (this.isDragging && this.dragElement) {
            const elementId = parseInt(this.dragElement.getAttribute('data-element-id'));
            const element = this.logicCore.elements.find(e => e.id === elementId);
            
            if (element) {
                const rect = this.svg.getBoundingClientRect();
                const newX = event.clientX - rect.left - this.dragOffset.x;
                const newY = event.clientY - rect.top - this.dragOffset.y;
                
                // 限制在画布范围内
                element.x = Math.max(0, Math.min(newX, this.svg.clientWidth - element.width));
                element.y = Math.max(0, Math.min(newY, this.svg.clientHeight - element.height));
                
                // 更新相关连接线
                this.updateConnectionsForElement(element);
                
                this.render();
            }
        }
    }

    /**
     * 处理鼠标抬起事件
     */
    handleMouseUp(event) {
        this.isDragging = false;
        this.dragElement = null;
        this.dragOffset = { x: 0, y: 0 };
    }

    /**
     * 更新元素的连接线
     */
    updateConnectionsForElement(element) {
        this.logicCore.connections.forEach(connection => {
            if (connection.from === element.id) {
                connection.fromX = element.x + element.width;
                connection.fromY = element.y + element.height / 2;
            }
            if (connection.to === element.id) {
                connection.toX = element.x;
                connection.toY = element.y + element.height / 2;
            }
        });
    }

    /**
     * 处理鼠标悬停事件
     */
    handleMouseOver(event) {
        const target = event.target.closest('.logic-element');
        
        if (target && this.tooltip) {
            const elementId = parseInt(target.getAttribute('data-element-id'));
            const element = this.logicCore.elements.find(e => e.id === elementId);
            
            if (element) {
                this.showTooltip(event, `表达式: ${element.text}`);
            }
        }
    }

    /**
     * 处理鼠标离开事件
     */
    handleMouseOut(event) {
        this.hideTooltip();
    }

    /**
     * 显示提示
     */
    showTooltip(event, text) {
        if (!this.tooltip) return;
        
        this.tooltip.textContent = text;
        this.tooltip.style.left = event.pageX + 10 + 'px';
        this.tooltip.style.top = event.pageY - 30 + 'px';
        this.tooltip.classList.add('show');
    }

    /**
     * 隐藏提示
     */
    hideTooltip() {
        if (!this.tooltip) return;
        
        this.tooltip.classList.remove('show');
    }

    /**
     * 生成变元元素
     */
    generateVariableElements(variables) {
        this.logicCore.clear();
        
        variables.forEach((variable, index) => {
            const x = 20;
            const y = 50 + index * 50;
            this.logicCore.createElement(variable, x, y);
        });
        
        this.render();
        this.updateOperatorButtonStates();
    }

    /**
     * 更新运算符按钮状态
     */
    updateOperatorButtonStates() {
        const selectedCount = this.logicCore.selectedElements.length;
        
        // 否定运算符：需要选择1个元素
        const negationBtn = document.querySelector('[data-operator="~"]');
        if (negationBtn) {
            negationBtn.disabled = selectedCount !== 1;
        }
        
        // 其他运算符：需要选择2个元素
        const binaryOperators = document.querySelectorAll('[data-operator]:not([data-operator="~"])');
        binaryOperators.forEach(btn => {
            btn.disabled = selectedCount !== 2;
        });
    }

    /**
     * 添加脉冲动画效果
     */
    addPulseEffect(element) {
        element.classList.add('pulse');
        setTimeout(() => {
            element.classList.remove('pulse');
        }, 500);
    }

    /**
     * 更新表达式显示
     */
    updateExpressionDisplay() {
        const display = document.getElementById('expression-display');
        if (display) {
            display.textContent = this.logicCore.currentExpression || '无';
        }
    }

    /**
     * 清空画布
     */
    clearCanvas() {
        this.logicCore.clear();
        this.render();
        this.updateOperatorButtonStates();
        this.updateExpressionDisplay();
    }
}

// 导出到全局作用域
window.UIController = UIController;
