export const measure = (function () {
    let instance = null;

    const createInstance = function () {
        const DEFAULT_TEXT_FONT = '13px "Gotham Pro", "Arial';
        let ctx = null;

        return {
            measureText: (text, font = DEFAULT_TEXT_FONT) => {
                if (!ctx) {
                    ctx = document.createElement('canvas').getContext('2d');
                }

                ctx.font = font;

                return ctx.measureText(text).width;
            }
        }
    };

    return {
        getInstance: function () {
            return instance || (instance = createInstance());
        }
    }
})();

export function measureText(text, font) {
    return Math.ceil(measure.getInstance().measureText(text, font));
}
