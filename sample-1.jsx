const sample = [
    {
        ...this.tableColumns.status,
        render: (...args) => {
            const [status, {id}] = args;
            const result = [this.tableColumns.status.render(...args)];

            if (status === STATUS.CONFIRMED) {
                result.push(
                    <div className="mt-0i5x">
                        <a onClick={this.onShowWithdrawalsModal(id)}>
                            Подробнее
                        </a>
                    </div>
                );
            }

            return result;
        }
    }
];