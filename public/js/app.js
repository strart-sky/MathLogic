/**
 * 主应用程序入口
 */

class MathLogicApp {
    constructor() {
        this.logicCore = new LogicCore();
        this.logicEvaluator = new LogicEvaluator();
        this.uiController = new UIController(this.logicCore);
        this.truthTableGenerator = new TruthTableGenerator(this.logicEvaluator);
        
        this.modal = null;
        this.isModalOpen = false;
        this.isDarkTheme = false;
    }

    /**
     * 初始化应用
     */
    init() {
        this.uiController.init();
        this.setupEventListeners();
        this.setupModal();
        console.log('MathLogic 应用已启动');
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 生成变元按钮
        document.getElementById('generate-btn').addEventListener('click', () => {
            this.handleGenerateVariables();
        });

        // 变元输入框回车事件
        document.getElementById('variables-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleGenerateVariables();
            }
        });

        // 运算符按钮
        document.querySelectorAll('.operator-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleOperatorClick(e.target.dataset.operator);
            });
        });

        // 功能按钮
        document.getElementById('clear-btn').addEventListener('click', () => {
            this.handleClear();
        });

        document.getElementById('truth-table-btn').addEventListener('click', () => {
            this.handleTruthTable();
        });

        document.getElementById('random-formula-btn').addEventListener('click', () => {
            this.handleRandomFormula();
        });

        // 主题切换按钮
        document.getElementById('theme-toggle-btn').addEventListener('click', () => {
            this.toggleTheme();
        });

        // 检查答案按钮
        document.getElementById('check-answers-btn').addEventListener('click', () => {
            this.handleCheckAnswers();
        });

        // 重新答题按钮
        document.getElementById('reset-answers-btn').addEventListener('click', () => {
            this.handleResetAnswers();
        });
    }

    /**
     * 设置模态框
     */
    setupModal() {
        this.modal = document.getElementById('truth-table-modal');
        const closeBtn = this.modal.querySelector('.close');
        
        closeBtn.addEventListener('click', () => {
            this.closeModal();
        });

        // 点击模态框外部关闭
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });

        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isModalOpen) {
                this.closeModal();
            }
        });
    }

    /**
     * 处理生成变元
     */
    handleGenerateVariables() {
        const input = document.getElementById('variables-input');
        const value = input.value.trim();
        
        if (!value) {
            this.showAlert('请输入变元！', 'warning');
            return;
        }

        const variables = this.logicCore.parseVariables(value);
        
        if (variables.length === 0) {
            this.showAlert('请输入有效的变元（如: p, q, r）', 'error');
            return;
        }

        this.uiController.generateVariableElements(variables);
        this.showAlert(`成功生成 ${variables.length} 个变元: ${variables.join(', ')}`, 'success');
        
        // 清空输入框
        input.value = '';
        
        // 添加脉冲效果
        this.uiController.addPulseEffect(document.getElementById('generate-btn'));
    }

    /**
     * 处理运算符点击
     */
    handleOperatorClick(operator) {
        const selectedCount = this.logicCore.selectedElements.length;
        
        if (operator === '~' && selectedCount !== 1) {
            this.showAlert('否定运算需要选择一个元素', 'warning');
            return;
        }
        
        if (operator !== '~' && selectedCount !== 2) {
            this.showAlert('二元运算需要选择两个元素', 'warning');
            return;
        }

        const success = this.logicCore.applyOperator(operator);
        
        if (success) {
            this.uiController.render();
            this.uiController.updateOperatorButtonStates();
            this.uiController.updateExpressionDisplay();
            this.showAlert(`成功应用运算符: ${operator}`, 'success');
        } else {
            this.showAlert('运算失败，请检查选择的元素', 'error');
        }
    }

    /**
     * 处理清空操作
     */
    handleClear() {
        if (this.logicCore.elements.length === 0) {
            this.showAlert('画布已经是空的', 'info');
            return;
        }

        this.uiController.clearCanvas();
        this.showAlert('画布已清空', 'success');
    }

    /**
     * 处理真值表生成
     */
    handleTruthTable() {
        if (!this.logicCore.currentExpression) {
            this.showAlert('请先构建一个逻辑表达式', 'warning');
            return;
        }

        try {
            this.truthTableGenerator.generateTable(this.logicCore.currentExpression);
            this.truthTableGenerator.renderTable('truth-table-container');
            this.openModal();
            this.showAlert('真值表已生成', 'success');
        } catch (error) {
            this.showAlert(`生成真值表失败: ${error.message}`, 'error');
        }
    }

    /**
     * 处理随机公式生成
     */
    handleRandomFormula() {
        const variableCount = Math.floor(Math.random() * 3) + 2; // 2-4个变元
        const formula = this.logicCore.generateRandomFormula(variableCount);
        
        // 解析公式并生成变元
        const variables = this.logicCore.getVariablesFromExpression(formula);
        this.uiController.generateVariableElements(variables);
        
        // 设置当前表达式
        this.logicCore.currentExpression = formula;
        this.uiController.updateExpressionDisplay();
        
        this.showAlert(`已生成随机公式: ${formula}`, 'success');
    }

    /**
     * 处理答案检查
     */
    handleCheckAnswers() {
        const result = this.truthTableGenerator.checkAnswers();
        const resultDisplay = document.getElementById('result-display');
        
        if (!result.isComplete) {
            this.showAlert(`请完成所有答案 ${result.answered}/${result.total}`, 'warning');
            // 仍然显示部分结果
            this.truthTableGenerator.highlightErrors(result);
            this.truthTableGenerator.showStatistics(result);
            return;
        }

        resultDisplay.style.display = 'block';
        
        if (result.correct === result.total) {
            resultDisplay.textContent = `所有答案正确 - 得分: ${result.score}%`;
            resultDisplay.className = 'result-correct';
            this.showAlert('完全正确!', 'success');
        } else {
            resultDisplay.textContent = `${result.correct}/${result.total} 正确 - 得分: ${result.score}%`;
            resultDisplay.className = 'result-incorrect';
            this.showAlert(`${result.total - result.correct} 题错误`, 'info');
        }
        
        // 显示正确答案和统计信息
        this.truthTableGenerator.revealAnswers();
        this.truthTableGenerator.highlightErrors(result);
        this.truthTableGenerator.showStatistics(result);
        
        // 显示重新答题按钮
        document.getElementById('reset-answers-btn').style.display = 'inline-block';
    }

    /**
     * 处理重新答题
     */
    handleResetAnswers() {
        // 清除所有单选按钮选择
        const radios = document.querySelectorAll('input[type="radio"]');
        radios.forEach(radio => {
            radio.checked = false;
        });

        // 重置表格样式
        const tableRows = document.querySelectorAll('.truth-table tbody tr');
        tableRows.forEach(row => {
            row.classList.remove('correct', 'incorrect', 'unanswered');
        });

        // 隐藏正确答案列
        const resultCells = document.querySelectorAll('.truth-table tbody tr td:nth-last-child(2)');
        resultCells.forEach(cell => {
            cell.style.display = 'none';
        });

        // 隐藏表头中的正确答案列
        const thead = document.querySelector('.truth-table thead tr');
        if (thead) {
            const resultTh = thead.querySelector('th:nth-last-child(2)');
            if (resultTh) {
                resultTh.style.display = 'none';
            }
        }

        // 隐藏结果显示和统计信息
        const resultDisplay = document.getElementById('result-display');
        resultDisplay.style.display = 'none';
        resultDisplay.className = '';

        const container = document.getElementById('truth-table-container');
        const existingStats = container.querySelector('.answer-statistics');
        if (existingStats) {
            existingStats.remove();
        }

        // 隐藏重新答题按钮
        document.getElementById('reset-answers-btn').style.display = 'none';

        // 重置真值表生成器的答案
        this.truthTableGenerator.userAnswers = {};

        this.showAlert('已重置，请重新答题', 'info');
    }

    /**
     * 切换主题
     */
    toggleTheme() {
        const stylesheet = document.getElementById('main-stylesheet');
        this.isDarkTheme = !this.isDarkTheme;
        
        if (this.isDarkTheme) {
            stylesheet.href = 'public/css/style-dark-red.css';
            this.showAlert('已切换到深红主题', 'info');
        } else {
            stylesheet.href = 'public/css/style.css';
            this.showAlert('已切换到浅色主题', 'info');
        }
    }

    /**
     * 打开模态框
     */
    openModal() {
        this.modal.style.display = 'block';
        this.isModalOpen = true;
        
        // 重置结果显示
        const resultDisplay = document.getElementById('result-display');
        resultDisplay.style.display = 'none';
        resultDisplay.className = '';

        // 隐藏重新答题按钮
        document.getElementById('reset-answers-btn').style.display = 'none';
        
        // 重置真值表样式
        setTimeout(() => {
            const tableRows = document.querySelectorAll('.truth-table tbody tr');
            tableRows.forEach(row => {
                row.classList.remove('correct', 'incorrect', 'unanswered');
            });
        }, 100);
    }

    /**
     * 关闭模态框
     */
    closeModal() {
        this.modal.style.display = 'none';
        this.isModalOpen = false;
        this.truthTableGenerator.reset();
    }

    /**
     * 显示提示信息
     */
    showAlert(message, type = 'info') {
        // 创建提示元素
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        // 样式
        Object.assign(alertDiv.style, {
            position: 'fixed',
            top: '16px',
            right: '16px',
            padding: '12px 16px',
            borderRadius: '0',
            color: '#333',
            fontSize: '12px',
            zIndex: '10000',
            maxWidth: '260px',
            opacity: '0',
            transform: 'translateX(100%)',
            transition: 'all 0.2s ease',
            border: '1px solid #e0e0e0',
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
        });

        // 根据类型设置背景色
        const isDark = this.isDarkTheme;
        switch (type) {
            case 'success':
                alertDiv.style.backgroundColor = isDark ? '#1a2a1a' : '#f8f9fa';
                break;
            case 'error':
                alertDiv.style.backgroundColor = isDark ? '#2a1a1a' : '#fff5f5';
                break;
            case 'warning':
                alertDiv.style.backgroundColor = isDark ? '#2a2a1a' : '#fffbf0';
                break;
            default:
                alertDiv.style.backgroundColor = isDark ? '#1a1a2a' : '#f0f8ff';
        }
        
        if (isDark) {
            alertDiv.style.color = '#e0e0e0';
            alertDiv.style.borderColor = '#4a3030';
        }

        document.body.appendChild(alertDiv);

        // 显示动画
        setTimeout(() => {
            alertDiv.style.opacity = '1';
            alertDiv.style.transform = 'translateX(0)';
        }, 10);

        // 自动隐藏
        setTimeout(() => {
            alertDiv.style.opacity = '0';
            alertDiv.style.transform = 'translateX(100%)';
            
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.parentNode.removeChild(alertDiv);
                }
            }, 300);
        }, 3000);
    }
}

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    const app = new MathLogicApp();
    app.init();
    
    // 将应用实例绑定到全局对象，方便调试
    window.mathLogicApp = app;
});
