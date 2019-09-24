export function getTableColumns(self) {
    const columns = _.cloneDeep({...TableColumns});

    // region --- add context(this) as the last argument to the render function
    for (let columnKey in columns) {
        if (columns.hasOwnProperty(columnKey)) {
            const render = columns[columnKey].render;
            if (render) {
                columns[columnKey].render = (...args) => {
                    return render(...args, self);
                };
            }
        }
    }
    // ---- endregion

    return columns;
}