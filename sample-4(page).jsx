import React from 'react';

import Page from '../../../components/Page/Page';
import Filter from './components/Filter';

export default class History extends Page {
    constructor(props) {
        super(props, {
            endPointSettings: {
                pathName: '/v1/transactions',
                params: {
                    expand: 'user',
                }
            },
            externalDataEndPoints: [
                {sections: {pathName: '/v1/transactions/sections'}},
            ],
            state: {
                sections: {},
            }
        });

        this.columns = [
            {...this.tableColumns.id, sorter: true},
            this.tableColumns.sum,
            this.tableColumns.operation,
            this.tableColumns.comment,
            this.tableColumns.dateOperation,
            this.tableColumns.webmaster,
        ];

        this.filter = (props) => {
            return (
                <Filter operations={this.state.sections} {...props}/>
            )
        };
    }
}