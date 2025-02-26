class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.scoreElement = document.getElementById('score');
        this.gridSize = 8;
        this.blockSize = this.canvas.width / this.gridSize;
        this.colors = ['😊', '😂', '🥰', '😎', '🤔'];
        this.grid = [];
        this.selected = null;
        this.isAnimating = false;
        this.hintTimer = null;
        this.hintBlocks = null;
        this.hintOpacity = 0;
        this.isHintAnimating = false;

        this.initializeGrid();
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        this.startHintTimer();
    }

    initializeGrid() {
        for (let i = 0; i < this.gridSize; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.gridSize; j++) {
                this.grid[i][j] = {
                    color: this.colors[Math.floor(Math.random() * this.colors.length)],
                    x: i,
                    y: j
                };
            }
        }
        this.draw();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j]) {
                    this.drawBlock(i, j);
                }
            }
        }
    }

    drawBlock(i, j) {
        const block = this.grid[i][j];
        if (!block) return;

        const x = block.animX !== undefined ? block.animX : i * this.blockSize;
        const y = block.animY !== undefined ? block.animY : j * this.blockSize;
        
        // 绘制背景
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.globalAlpha = block.opacity !== undefined ? block.opacity : 1;
        this.ctx.fillRect(x, y, this.blockSize - 2, this.blockSize - 2);
        
        // 绘制表情
        this.ctx.font = `${this.blockSize * 0.8}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            block.color,
            x + this.blockSize / 2,
            y + this.blockSize / 2
        );

        // 绘制选中效果
        if (this.selected && this.selected.x === i && this.selected.y === j) {
            this.ctx.strokeStyle = '#4CAF50';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(
                x + 2,
                y + 2,
                this.blockSize - 6,
                this.blockSize - 6
            );
        }

        // 绘制提示效果
        if (this.hintBlocks && 
            this.hintBlocks.some(block => block.x === i && block.y === j)) {
            this.ctx.strokeStyle = '#FFA500';
            this.ctx.lineWidth = 3;
            this.ctx.globalAlpha = this.hintOpacity;
            this.ctx.strokeRect(
                x + 2,
                y + 2,
                this.blockSize - 6,
                this.blockSize - 6
            );
        }
        this.ctx.globalAlpha = 1;
    }

    startHintTimer() {
        this.hintTimer = setTimeout(() => this.showHint(), 15000);
    }

    resetHintTimer() {
        if (this.hintTimer) {
            clearTimeout(this.hintTimer);
        }
        this.startHintTimer();
    }

    clearHint() {
        this.hintBlocks = null;
        this.hintOpacity = 0;
        this.isHintAnimating = false;
    }

    findPossibleMatch() {
        // 检查水平相邻的三个方块
        for (let j = 0; j < this.gridSize; j++) {
            for (let i = 0; i < this.gridSize - 1; i++) {
                // 尝试水平交换
                if (this.grid[i][j] && this.grid[i + 1][j]) {
                    // 临时交换
                    const temp = this.grid[i][j];
                    this.grid[i][j] = this.grid[i + 1][j];
                    this.grid[i + 1][j] = temp;

                    // 检查是否形成匹配
                    if (this.checkMatches()) {
                        // 还原交换
                        this.grid[i + 1][j] = this.grid[i][j];
                        this.grid[i][j] = temp;
                        return [{x: i, y: j}, {x: i + 1, y: j}];
                    }

                    // 还原交换
                    this.grid[i + 1][j] = this.grid[i][j];
                    this.grid[i][j] = temp;
                }
            }
        }

        // 检查垂直相邻的三个方块
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize - 1; j++) {
                // 尝试垂直交换
                if (this.grid[i][j] && this.grid[i][j + 1]) {
                    // 临时交换
                    const temp = this.grid[i][j];
                    this.grid[i][j] = this.grid[i][j + 1];
                    this.grid[i][j + 1] = temp;

                    // 检查是否形成匹配
                    if (this.checkMatches()) {
                        // 还原交换
                        this.grid[i][j + 1] = this.grid[i][j];
                        this.grid[i][j] = temp;
                        return [{x: i, y: j}, {x: i, y: j + 1}];
                    }

                    // 还原交换
                    this.grid[i][j + 1] = this.grid[i][j];
                    this.grid[i][j] = temp;
                }
            }
        }

        return null;
    }

    async showHint() {
        if (this.isAnimating || this.isHintAnimating) return;

        const possibleMatch = this.findPossibleMatch();
        if (!possibleMatch) return;

        this.hintBlocks = possibleMatch;
        this.isHintAnimating = true;

        while (this.isHintAnimating) {
            // 提示动画
            for (let opacity = 0; opacity <= 1; opacity += 0.1) {
                if (!this.isHintAnimating) break;
                this.hintOpacity = opacity;
                this.draw();
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            for (let opacity = 1; opacity >= 0; opacity -= 0.1) {
                if (!this.isHintAnimating) break;
                this.hintOpacity = opacity;
                this.draw();
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }
    }

    handleClick(event) {
        if (this.isAnimating) return;

        this.resetHintTimer();
        this.clearHint();

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const i = Math.floor(x / this.blockSize);
        const j = Math.floor(y / this.blockSize);

        if (i >= 0 && i < this.gridSize && j >= 0 && j < this.gridSize) {
            if (this.selected) {
                if (this.isAdjacent(this.selected, {x: i, y: j})) {
                    this.swapBlocks(this.selected, {x: i, y: j});
                }
                this.selected = null;
            } else {
                this.selected = {x: i, y: j};
            }
            this.draw();
        }
    }

    isAdjacent(block1, block2) {
        return Math.abs(block1.x - block2.x) + Math.abs(block1.y - block2.y) === 1;
    }

    async swapBlocks(block1, block2) {
        const block1Elem = this.grid[block1.x][block1.y];
        const block2Elem = this.grid[block2.x][block2.y];
        
        // 动画交换位置
        const frames = 5;
        const dx = (block2.x - block1.x) * this.blockSize / frames;
        const dy = (block2.y - block1.y) * this.blockSize / frames;
        
        for (let i = 0; i < frames; i++) {
            block1Elem.animX = block1.x * this.blockSize + dx * i;
            block1Elem.animY = block1.y * this.blockSize + dy * i;
            block2Elem.animX = block2.x * this.blockSize - dx * i;
            block2Elem.animY = block2.y * this.blockSize - dy * i;
            this.draw();
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        // 实际交换数据
        this.grid[block1.x][block1.y] = block2Elem;
        this.grid[block2.x][block2.y] = block1Elem;
        delete block1Elem.animX;
        delete block1Elem.animY;
        delete block2Elem.animX;
        delete block2Elem.animY;

        if (!this.checkMatches()) {
            // 如果没有匹配，动画交换回来
            for (let i = frames - 1; i >= 0; i--) {
                block1Elem.animX = block1.x * this.blockSize + dx * i;
                block1Elem.animY = block1.y * this.blockSize + dy * i;
                block2Elem.animX = block2.x * this.blockSize - dx * i;
                block2Elem.animY = block2.y * this.blockSize - dy * i;
                this.draw();
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            
            // 实际交换回数据
            this.grid[block1.x][block1.y] = block1Elem;
            this.grid[block2.x][block2.y] = block2Elem;
        } else {
            await this.handleMatches();
        }
        this.draw();
    }

    checkMatches() {
        const matches = new Set();
        // 检查水平匹配
        for (let j = 0; j < this.gridSize; j++) {
            let count = 1;
            let color = this.grid[0][j] ? this.grid[0][j].color : null;
            for (let i = 1; i < this.gridSize; i++) {
                if (this.grid[i][j] && color === this.grid[i][j].color) {
                    count++;
                } else {
                    if (count >= 3) {
                        for (let k = i - count; k < i; k++) {
                            matches.add(`${k},${j}`);
                        }
                    }
                    count = 1;
                    color = this.grid[i][j] ? this.grid[i][j].color : null;
                }
            }
            if (count >= 3) {
                for (let k = this.gridSize - count; k < this.gridSize; k++) {
                    matches.add(`${k},${j}`);
                }
            }
        }

        // 检查垂直匹配
        for (let i = 0; i < this.gridSize; i++) {
            let count = 1;
            let color = this.grid[i][0] ? this.grid[i][0].color : null;
            for (let j = 1; j < this.gridSize; j++) {
                if (this.grid[i][j] && color === this.grid[i][j].color) {
                    count++;
                } else {
                    if (count >= 3) {
                        for (let k = j - count; k < j; k++) {
                            matches.add(`${i},${k}`);
                        }
                    }
                    count = 1;
                    color = this.grid[i][j] ? this.grid[i][j].color : null;
                }
            }
            if (count >= 3) {
                for (let k = this.gridSize - count; k < this.gridSize; k++) {
                    matches.add(`${i},${k}`);
                }
            }
        }

        return matches.size > 0;
    }

    async handleMatches() {
        this.isAnimating = true;
        while (this.checkMatches()) {
            const matches = new Set();
            // 找到所有匹配
            for (let j = 0; j < this.gridSize; j++) {
                for (let i = 0; i < this.gridSize; i++) {
                    if (!this.grid[i][j]) continue;
                    let horizontalCount = 1;
                    let verticalCount = 1;

                    // 检查水平匹配
                    for (let k = i + 1; k < this.gridSize; k++) {
                        if (this.grid[k][j] && this.grid[k][j].color === this.grid[i][j].color) {
                            horizontalCount++;
                        } else break;
                    }

                    // 检查垂直匹配
                    for (let k = j + 1; k < this.gridSize; k++) {
                        if (this.grid[i][k] && this.grid[i][k].color === this.grid[i][j].color) {
                            verticalCount++;
                        } else break;
                    }

                    if (horizontalCount >= 3) {
                        for (let k = i; k < i + horizontalCount; k++) {
                            matches.add(`${k},${j}`);
                        }
                    }
                    if (verticalCount >= 3) {
                        for (let k = j; k < j + verticalCount; k++) {
                            matches.add(`${i},${k}`);
                        }
                    }
                }
            }

            // 更新分数
            this.score += matches.size * 10;
            this.scoreElement.textContent = this.score;

            // 消除动画
            const matchedBlocks = Array.from(matches).map(pos => {
                const [x, y] = pos.split(',').map(Number);
                return this.grid[x][y];
            });

            // 渐隐动画
            for (let opacity = 1; opacity >= 0; opacity -= 0.2) {
                matchedBlocks.forEach(block => {
                    if (block) block.opacity = opacity;
                });
                this.draw();
                await new Promise(resolve => setTimeout(resolve, 15));
            }

            // 移除匹配的方块
            matches.forEach(pos => {
                const [x, y] = pos.split(',').map(Number);
                this.grid[x][y] = null;
            });

            // 方块下落
            for (let i = 0; i < this.gridSize; i++) {
                let emptySpaces = 0;
                for (let j = this.gridSize - 1; j >= 0; j--) {
                    if (!this.grid[i][j]) {
                        emptySpaces++;
                    } else if (emptySpaces > 0) {
                        const block = this.grid[i][j];
                        const targetY = j + emptySpaces;
                        
                        // 下落动画
                        const frames = 5;
                        const dy = (targetY - j) * this.blockSize / frames;
                        for (let frame = 0; frame < frames; frame++) {
                            block.animY = j * this.blockSize + dy * frame;
                            this.draw();
                            await new Promise(resolve => setTimeout(resolve, 10));
                        }
                        
                        this.grid[i][targetY] = block;
                        this.grid[i][j] = null;
                        delete block.animY;
                    }
                }

                // 在顶部生成新方块
                for (let j = 0; j < emptySpaces; j++) {
                    // 获取周围方块的颜色
                    const surroundingColors = new Set();
                    if (j > 0 && this.grid[i][j-1]) surroundingColors.add(this.grid[i][j-1].color);
                    if (i > 0 && this.grid[i-1][j]) surroundingColors.add(this.grid[i-1][j].color);
                    if (i < this.gridSize-1 && this.grid[i+1][j]) surroundingColors.add(this.grid[i+1][j].color);
                    
                    // 筛选出不在周围的颜色
                    const availableColors = this.colors.filter(color => !surroundingColors.has(color));
                    
                    // 如果没有可用颜色，则使用所有颜色
                    const colorPool = availableColors.length > 0 ? availableColors : this.colors;
                    
                    const block = {
                        color: colorPool[Math.floor(Math.random() * colorPool.length)],
                        x: i,
                        y: j,
                        opacity: 0
                    };
                    this.grid[i][j] = block;

                    // 渐现动画
                    for (let opacity = 0; opacity <= 1; opacity += 0.2) {
                        block.opacity = opacity;
                        this.draw();
                        await new Promise(resolve => setTimeout(resolve, 10));
                    }
                    delete block.opacity;
                }
            }

            this.draw();
        }
        this.isAnimating = false;
    }
}

// 启动游戏
window.onload = () => {
    new Game();
};