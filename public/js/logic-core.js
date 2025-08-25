/**
 * MathLogic - 数理逻辑核心模块
 * 处理逻辑表达式的解析、计算和真值表生成
 */

class LogicCore {
    constructor() {
        this.operators = ['∧', '∨', '~', '→', '↔'];
        this.variables = [];
        this.elements = [];
        this.connections = [];
        this.selectedElements = [];
        this.currentExpression = '';
        this.nextElementId = 1;
    }

    /**
     * 检查字符是否为变元
     */
    isVariable(char) {
        return /^[a-zA-Z]$/.test(char) && !this.operators.includes(char);
    }

    /**
     * 解析输入的变元字符串
     */
    parseVariables(input) {
        const vars = [];
        for (let char of input) {
            if (this.isVariable(char) && !vars.includes(char)) {
                vars.push(char);
            }
        }
        return vars;
    }

    /**
     * 生成随机逻辑表达式
     */
    generateRandomFormula(variableCount = 2) {
        const vars = ['p', 'q', 'r', 's', 't'].slice(0, Math.max(2, variableCount));
        const operators = ['∧', '∨', '→', '↔'];
        
        let result = vars[0];
        
        for (let i = 0; i < variableCount - 1; i++) {
            const operator = operators[Math.floor(Math.random() * operators.length)];
            const variable = vars[Math.floor(Math.random() * vars.length)];
            
            if (Math.random() < 0.3) {
                // 30% 概率添加否定
                result = `(~${result})`;
            }
            
            result = `(${result}${operator}${variable})`;
        }
        
        return result;
    }

    /**
     * 创建新的逻辑元素
     */
    createElement(text, x, y) {
        const element = {
            id: this.nextElementId++,
            text: text,
            x: x,
            y: y,
            width: this.calculateTextWidth(text) + 20,
            height: 30,
            isSelected: false
        };
        
        this.elements.push(element);
        return element;
    }

    /**
     * 计算文本宽度（简单估算）
     */
    calculateTextWidth(text) {
        return text.length * 12 + 10;
    }

    /**
     * 选择或取消选择元素
     */
    toggleSelection(elementId) {
        const element = this.elements.find(e => e.id === elementId);
        if (!element) return;

        if (element.isSelected) {
            element.isSelected = false;
            this.selectedElements = this.selectedElements.filter(id => id !== elementId);
        } else {
            element.isSelected = true;
            this.selectedElements.push(elementId);
        }
    }

    /**
     * 清除所有选择
     */
    clearSelection() {
        this.elements.forEach(element => element.isSelected = false);
        this.selectedElements = [];
    }

    /**
     * 应用运算符
     */
    applyOperator(operator) {
        if (operator === '~' && this.selectedElements.length === 1) {
            return this.applyNegation();
        } else if (operator !== '~' && this.selectedElements.length === 2) {
            return this.applyBinaryOperator(operator);
        }
        return false;
    }

    /**
     * 应用否定运算
     */
    applyNegation() {
        const elementId = this.selectedElements[0];
        const element = this.elements.find(e => e.id === elementId);
        
        if (!element) return false;

        const newText = `(~${element.text})`;
        const newElement = this.createElement(
            newText, 
            element.x + element.width + 100, 
            element.y
        );

        // 创建连接线
        this.createConnection(element, newElement);
        
        // 更新当前表达式
        this.currentExpression = newText;
        
        // 清除选择
        this.clearSelection();
        
        return true;
    }

    /**
     * 应用二元运算符
     */
    applyBinaryOperator(operator) {
        if (this.selectedElements.length !== 2) return false;

        const element1 = this.elements.find(e => e.id === this.selectedElements[0]);
        const element2 = this.elements.find(e => e.id === this.selectedElements[1]);
        
        if (!element1 || !element2) return false;

        const newText = `(${element1.text}${operator}${element2.text})`;
        const newX = Math.max(element1.x + element1.width, element2.x + element2.width) + 100;
        const newY = (element1.y + element2.y) / 2;
        
        const newElement = this.createElement(newText, newX, newY);

        // 创建连接线
        this.createConnection(element1, newElement);
        this.createConnection(element2, newElement);
        
        // 更新当前表达式
        this.currentExpression = newText;
        
        // 清除选择
        this.clearSelection();
        
        return true;
    }

    /**
     * 创建连接线
     */
    createConnection(fromElement, toElement) {
        const connection = {
            id: Date.now() + Math.random(),
            from: fromElement.id,
            to: toElement.id,
            fromX: fromElement.x + fromElement.width,
            fromY: fromElement.y + fromElement.height / 2,
            toX: toElement.x,
            toY: toElement.y + toElement.height / 2
        };
        
        this.connections.push(connection);
        return connection;
    }

    /**
     * 清空所有数据
     */
    clear() {
        this.elements = [];
        this.connections = [];
        this.selectedElements = [];
        this.currentExpression = '';
        this.nextElementId = 1;
    }

    /**
     * 获取表达式中的所有唯一变元
     */
    getVariablesFromExpression(expression) {
        const variables = new Set();
        for (let char of expression) {
            if (this.isVariable(char)) {
                variables.add(char);
            }
        }
        return Array.from(variables).sort();
    }
}

// 逻辑运算求值器
class LogicEvaluator {
    constructor() {
        this.operators = {
            '~': { precedence: 4, unary: true },
            '∧': { precedence: 3, binary: true },
            '∨': { precedence: 2, binary: true },
            '→': { precedence: 1, binary: true },
            '↔': { precedence: 1, binary: true }
        };
    }

    /**
     * 将中缀表达式转换为后缀表达式
     */
    infixToPostfix(expression) {
        const output = [];
        const operatorStack = [];
        
        for (let i = 0; i < expression.length; i++) {
            const char = expression[i];
            
            if (char === ' ') continue;
            
            if (this.isVariable(char)) {
                output.push(char);
            } else if (char === '(') {
                operatorStack.push(char);
            } else if (char === ')') {
                while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
                    output.push(operatorStack.pop());
                }
                if (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] === '(') {
                    operatorStack.pop();
                }
            } else if (this.operators[char]) {
                while (
                    operatorStack.length > 0 &&
                    operatorStack[operatorStack.length - 1] !== '(' &&
                    this.operators[operatorStack[operatorStack.length - 1]] &&
                    this.operators[operatorStack[operatorStack.length - 1]].precedence >= this.operators[char].precedence
                ) {
                    output.push(operatorStack.pop());
                }
                operatorStack.push(char);
            }
        }
        
        while (operatorStack.length > 0) {
            output.push(operatorStack.pop());
        }
        
        return output;
    }

    /**
     * 计算后缀表达式的值
     */
    evaluatePostfix(postfix, variableValues) {
        const stack = [];
        
        for (const token of postfix) {
            if (this.isVariable(token)) {
                stack.push(variableValues[token]);
            } else if (this.operators[token]) {
                if (this.operators[token].unary) {
                    const operand = stack.pop();
                    stack.push(this.applyUnaryOperator(token, operand));
                } else if (this.operators[token].binary) {
                    const operand2 = stack.pop();
                    const operand1 = stack.pop();
                    stack.push(this.applyBinaryOperator(token, operand1, operand2));
                }
            }
        }
        
        return stack[0];
    }

    /**
     * 应用一元运算符
     */
    applyUnaryOperator(operator, operand) {
        switch (operator) {
            case '~':
                return !operand;
            default:
                throw new Error(`Unknown unary operator: ${operator}`);
        }
    }

    /**
     * 应用二元运算符
     */
    applyBinaryOperator(operator, operand1, operand2) {
        switch (operator) {
            case '∧':
                return operand1 && operand2;
            case '∨':
                return operand1 || operand2;
            case '→':
                return !operand1 || operand2;
            case '↔':
                return operand1 === operand2;
            default:
                throw new Error(`Unknown binary operator: ${operator}`);
        }
    }

    /**
     * 判断字符是否为变元
     */
    isVariable(char) {
        return /^[a-zA-Z]$/.test(char);
    }

    /**
     * 求值逻辑表达式
     */
    evaluate(expression, variableValues) {
        try {
            const postfix = this.infixToPostfix(expression);
            return this.evaluatePostfix(postfix, variableValues);
        } catch (error) {
            console.error('Expression evaluation error:', error);
            return false;
        }
    }
}

// 导出到全局作用域
window.LogicCore = LogicCore;
window.LogicEvaluator = LogicEvaluator;
