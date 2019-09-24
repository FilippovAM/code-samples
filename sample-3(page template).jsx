import React from 'react';

import api from '../../common/Api/Api';
import Helpers, {Filters, handleTableChange, onFilter} from '../../common/Helpers';
import {getTableColumns} from '../../common/TableColumns';
import DefaultTable from '../Table/DefaultTable/DefaultTable';

// TODO: update others pages with this template
export default class Page extends React.Component {
    tableColumns = getTableColumns(this);
    handleTableChange = handleTableChange.bind(this);
    onFilterSubmit = onFilter.bind(this);

    endPointSettings = {pathName: '', params: {}};
    externalDataEndPoints = []; // array of endPointSettings

    title = '';
    tableProps = {};
    containerProps = {};
    columns = []; // table columns
    externalDataIsLoaded = false;
    filter = null;
    modal = null;

    constructor(props, settings) {
        super(props);

        const {state, endPointSettings = {}, externalDataEndPoints = []} = settings;

        this.state = {
            isLoading: false,
            filters: Filters.parse(),
            data: [],
            pagination: {
                current: 1,
                sort: '-id',
                hideOnSinglePage: true,
            },
            ...state,
        };

        this.endPointSettings = endPointSettings;
        this.externalDataEndPoints = externalDataEndPoints;
    }

    componentDidMount() {
        if (this.title) {
            Helpers.setTitle(this.title);
        }

        // region ---- process external data
        const loadExternalData = !!this.externalDataEndPoints.length;
        if (loadExternalData) {
            this.fetchExternalData();
        } else {
            this.externalDataIsLoaded = true;
        }
        // ---- endregion

        this.fetch();
    }

    fetch = () => {
        const {filters} = this.state;

        this.setState({isLoading: true});

        let pagination = {...this.state.pagination};

        api.get(this.endPointSettings.pathName, {
            params: {
                sort: pagination.sort,
                page: pagination.current,
                ...filters,
                ...this.endPointSettings.params,
            }
        }).then((res) => {
            const {headers} = res;
            let {data} = res;

            if (this.onFetch) {
                data = this.onFetch(data);
            }

            pagination.total = parseInt(headers['x-pagination-total-count']);

            this.setState({
                data: data,
                isLoading: !this.externalDataIsLoaded, // if additional data has not been loaded continue to show the loader
                pagination,
            });

        }).catch((e) => {
            this.setState({isLoading: !this.externalDataIsLoaded});
            Helpers.errorHandler(e);
        });

        Filters.toUrl(filters);
    };

    fetchExternalData = () => {
        this.setState({
            isLoading: true
        });

        const promises = [];

        this.externalDataEndPoints.forEach((item) => {
            const endPointSettings = Object.values(item)[0];
            const {pathName, params} = endPointSettings;
            promises.push(api.get(pathName, {params}));
        });

        Promise.all(promises)
            .then((values) => {
                this.externalDataIsLoaded = true;

                let data = {};

                values.forEach((value, index) => {
                    const dataKey = Object.keys(this.externalDataEndPoints[index])[0];
                    data[dataKey] = {...data[dataKey], ...value.data};
                });

                this.setState({
                    isLoading: false,
                    ...data,
                });
            })
            .catch((e) => {
                Helpers.errorHandler(e);
                this.setState({isLoading: false});
            });
    };

    render() {
        const {isLoading, pagination, data, filters} = this.state;
        const hasFilter = !!this.filter;
        const hasTable = !!this.columns.length;
        const hasModal = !!this.modal;

        return (
            <div {...this.containerProps}>
                {hasFilter && this.filter({
                    onSubmit: this.onFilterSubmit,
                    filters: filters,
                })}

                {hasTable && <DefaultTable
                    {...this.tableProps}
                    loading={isLoading}
                    columns={this.columns}
                    onChange={this.handleTableChange}
                    pagination={this.externalDataIsLoaded ? pagination : undefined}
                    dataSource={this.externalDataIsLoaded ? data : []}
                />}

                {hasModal && this.modal()}
            </div>
        )
    }
}