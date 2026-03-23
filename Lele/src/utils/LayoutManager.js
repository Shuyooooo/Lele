export class LayoutManager
{
    constructor(scene)
    {
        this.scene = scene;
        this.baseWidth = 1280;
        this.baseHeight = 960;
        this.scaleX = 1;
        this.scaleY = 1;
        this.updateScale();
    }

    updateScale()
    {
        this.scaleX = this.scene.scale.width / this.baseWidth;
        this.scaleY = this.scene.scale.height / this.baseHeight;
    }

    // 使用百分比坐标设置位置
    setPositionPercent(obj, xPercent, yPercent, rect = null)
    {
        const r = rect || {
            x: 0,
            y: 0,
            width: this.scene.scale.width,
            height: this.scene.scale.height
        };
        const x = r.x + r.width * (xPercent / 100);
        const y = r.y + r.height * (yPercent / 100);
        obj.setPosition(x, y);
        return obj;
    }

    // 使用百分比设置统一缩放（scalePercent: 100 = 1.0）
    setScalePercent(obj, scalePercent)
    {
        const s = scalePercent / 100;
        obj.setScale(s);
        return obj;
    }

    // 使用百分比设置大小（基于原始尺寸）
    setSizePercent(obj, widthPercent, heightPercent)
    {
        const scaleX = (this.scene.scale.width * (widthPercent / 100)) / obj.width;
        const scaleY = (this.scene.scale.height * (heightPercent / 100)) / obj.height;
        obj.setScale(scaleX, scaleY);
        return obj;
    }

    // 自适应缩放以适应容器
    fitToContainer(obj, containerWidth, containerHeight, margin = 0)
    {
        const availableWidth = containerWidth - (margin * 2);
        const availableHeight = containerHeight - (margin * 2);
        const scaleX = availableWidth / obj.width;
        const scaleY = availableHeight / obj.height;
        const scale = Math.min(scaleX, scaleY);
        obj.setScale(scale);
        return obj;
    }

    // 获取相对于基础分辨率的坐标
    getScaledPosition(x, y)
    {
        return {
            x: x * this.scaleX,
            y: y * this.scaleY
        };
    }
}

