/**
 * 真值表生成器和管理器
 */

class TruthTableGenerator {
    constructor(logicEvaluator) {
        this.evaluator = logicEvaluator;
        this.currentTable = null;
        this.userAnswers = {};
    }

    /**
     * 生成真值表数据
     */
    generateTable(expression) {
        if (!expression || expression.trim() === '') {
            throw new Error('表达式不能为空');
        }

        // 提取变元
        const variables = this.getVariables(expression);
        if (variables.length === 0) {
            throw new Error('表达式中没有找到有效变元');
        }

        // 生成所有可能的真值组合
        const combinations = this.generateCombinations(variables.length);
        
        // 计算每行的结果
        const rows = combinations.map((combination, index) => {
            const variableValues = {};
            variables.forEach((variable, i) => {
                variableValues[variable] = combination[i];
            });

            const result = this.evaluator.evaluate(expression, variableValues);
            
            return {
                index: index,
                variables: combination,
                result: result,
                userAnswer: null
            };
        });

        this.currentTable = {
            expression: expression,
            variables: variables,
            rows: rows
        };

        return this.currentTable;
    }

    /**
     * 从表达式中提取变元
     */
    getVariables(expression) {
        const variables = new Set();
        for (let char of expression) {
            if (/^[a-zA-Z]$/.test(char)) {
                variables.add(char);
            }
        }
        return Array.from(variables).sort();
    }

    /**
     * 生成所有可能的真值组合
     */
    generateCombinations(variableCount) {
        const combinations = [];
        const totalCombinations = Math.pow(2, variableCount);

        for (let i = 0; i < totalCombinations; i++) {
            const combination = [];
            for (let j = variableCount - 1; j >= 0; j--) {
                combination.push((i >> j) & 1 ? true : false);
            }
            combinations.push(combination);
        }

        return combinations;
    }

    /**
     * 渲染真值表到DOM
     */
    renderTable(containerId) {
        const container = document.getElementById(containerId);
        if (!container || !this.currentTable) {
            return;
        }

        container.innerHTML = '';

        // 创建表格
        const table = document.createElement('table');
        table.className = 'truth-table';

        // 创建表头
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        // 变元列
        this.currentTable.variables.forEach(variable => {
            const th = document.createElement('th');
            th.textContent = variable;
            headerRow.appendChild(th);
        });

        // 表达式列
        const expressionTh = document.createElement('th');
        expressionTh.textContent = this.currentTable.expression;
        headerRow.appendChild(expressionTh);

        // 用户答案列
        const userAnswerTh = document.createElement('th');
        userAnswerTh.textContent = '你的答案';
        headerRow.appendChild(userAnswerTh);

        thead.appendChild(headerRow);
        table.appendChild(thead);

        // 创建表体
        const tbody = document.createElement('tbody');
        this.currentTable.rows.forEach((row, index) => {
            const tr = document.createElement('tr');

            // 变元值
            row.variables.forEach(value => {
                const td = document.createElement('td');
                td.textContent = value ? 'T' : 'F';
                tr.appendChild(td);
            });

            // 正确答案（隐藏）
            const resultTd = document.createElement('td');
            resultTd.textContent = row.result ? 'T' : 'F';
            resultTd.style.display = 'none';
            tr.appendChild(resultTd);

            // 用户答案输入
            const userAnswerTd = document.createElement('td');
            const radioGroup = this.createRadioGroup(index);
            userAnswerTd.appendChild(radioGroup);
            tr.appendChild(userAnswerTd);

            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        container.appendChild(table);
    }

    /**
     * 创建单选按钮组
     */
    createRadioGroup(rowIndex) {
        const group = document.createElement('div');
        group.className = 'truth-radio-group';

        // True 选项
        const trueOption = document.createElement('div');
        trueOption.className = 'radio-option';

        const trueRadio = document.createElement('input');
        trueRadio.type = 'radio';
        trueRadio.name = `answer_${rowIndex}`;
        trueRadio.value = 'true';
        trueRadio.id = `answer_${rowIndex}_true`;

        const trueLabel = document.createElement('label');
        trueLabel.htmlFor = `answer_${rowIndex}_true`;
        trueLabel.textContent = 'T';

        trueOption.appendChild(trueRadio);
        trueOption.appendChild(trueLabel);

        // False 选项
        const falseOption = document.createElement('div');
        falseOption.className = 'radio-option';

        const falseRadio = document.createElement('input');
        falseRadio.type = 'radio';
        falseRadio.name = `answer_${rowIndex}`;
        falseRadio.value = 'false';
        falseRadio.id = `answer_${rowIndex}_false`;

        const falseLabel = document.createElement('label');
        falseLabel.htmlFor = `answer_${rowIndex}_false`;
        falseLabel.textContent = 'F';

        falseOption.appendChild(falseRadio);
        falseOption.appendChild(falseLabel);

        group.appendChild(trueOption);
        group.appendChild(falseOption);

        return group;
    }

    /**
     * 收集用户答案
     */
    collectUserAnswers() {
        const answers = {};
        
        if (!this.currentTable) return answers;

        this.currentTable.rows.forEach((row, index) => {
            const selectedRadio = document.querySelector(`input[name="answer_${index}"]:checked`);
            if (selectedRadio) {
                answers[index] = selectedRadio.value === 'true';
            }
        });

        this.userAnswers = answers;
        return answers;
    }

    /**
     * 检查答案
     */
    checkAnswers() {
        this.collectUserAnswers();
        
        if (!this.currentTable) {
            return { correct: 0, total: 0, isComplete: false };
        }

        let correct = 0;
        let total = this.currentTable.rows.length;
        let answered = 0;

        const results = this.currentTable.rows.map((row, index) => {
            const userAnswer = this.userAnswers[index];
            const correctAnswer = row.result;
            
            if (userAnswer !== undefined) {
                answered++;
                const isCorrect = userAnswer === correctAnswer;
                if (isCorrect) correct++;
                
                return {
                    index: index,
                    userAnswer: userAnswer,
                    correctAnswer: correctAnswer,
                    isCorrect: isCorrect
                };
            }
            
            return {
                index: index,
                userAnswer: null,
                correctAnswer: correctAnswer,
                isCorrect: false
            };
        });

        return {
            correct: correct,
            total: total,
            answered: answered,
            isComplete: answered === total,
            results: results,
            score: total > 0 ? (correct / total * 100).toFixed(1) : 0
        };
    }

    /**
     * 显示正确答案
     */
    revealAnswers() {
        if (!this.currentTable) return;

        const table = document.querySelector('.truth-table tbody');
        if (!table) return;

        // 显示正确答案列
        const resultCells = table.querySelectorAll('tr td:nth-last-child(2)');
        resultCells.forEach(cell => {
            cell.style.display = 'table-cell';
        });

        // 更新表头
        const thead = document.querySelector('.truth-table thead tr');
        if (thead) {
            const existingResultTh = thead.querySelector('th:nth-last-child(2)');
            if (existingResultTh) {
                existingResultTh.style.display = 'table-cell';
                existingResultTh.textContent = '正确答案';
            }
        }
    }

    /**
     * 高亮显示错误答案
     */
    highlightErrors(checkResult) {
        if (!checkResult || !checkResult.results) return;

        const table = document.querySelector('.truth-table tbody');
        if (!table) return;

        checkResult.results.forEach((result, index) => {
            const row = table.children[index];
            if (!row) return;

            // 移除之前的类
            row.classList.remove('correct', 'incorrect', 'unanswered');

            if (result.userAnswer === null) {
                row.classList.add('unanswered');
            } else if (result.isCorrect) {
                row.classList.add('correct');
            } else {
                row.classList.add('incorrect');
            }
        });
    }

    /**
     * 显示答案统计
     */
    showStatistics(checkResult) {
        if (!checkResult) return;

        const container = document.getElementById('truth-table-container');
        if (!container) return;

        // 移除之前的统计信息
        const existingStats = container.querySelector('.answer-statistics');
        if (existingStats) {
            existingStats.remove();
        }

        const statsDiv = document.createElement('div');
        statsDiv.className = 'answer-statistics';

        const correctCount = checkResult.correct;
        const incorrectCount = checkResult.answered - checkResult.correct;
        const unansweredCount = checkResult.total - checkResult.answered;

        statsDiv.innerHTML = `
            <div class="stat-item">
                <span>正确答案:</span>
                <span>${correctCount}/${checkResult.total}</span>
            </div>
            <div class="stat-item">
                <span>错误答案:</span>
                <span>${incorrectCount}/${checkResult.total}</span>
            </div>
            <div class="stat-item">
                <span>未答题目:</span>
                <span>${unansweredCount}/${checkResult.total}</span>
            </div>
            <div class="stat-item">
                <span>正确率:</span>
                <span>${checkResult.score}%</span>
            </div>
        `;

        container.appendChild(statsDiv);
    }

    /**
     * 重置真值表
     */
    reset() {
        this.currentTable = null;
        this.userAnswers = {};
        
        // 移除统计信息
        const container = document.getElementById('truth-table-container');
        if (container) {
            const existingStats = container.querySelector('.answer-statistics');
            if (existingStats) {
                existingStats.remove();
            }
        }
    }
}

// 导出到全局作用域
window.TruthTableGenerator = TruthTableGenerator;
