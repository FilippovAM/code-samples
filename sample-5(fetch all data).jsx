import React from 'react'
import {connect} from 'react-redux';
import moment from 'moment/moment';
import _ from 'lodash';

import {DAY, STATISTIC_TYPE} from '../../../constants/common';
import Helpers, {onFilter, Filters} from '../../../common/Helpers';
import {getTableColumns} from '../../../common/TableColumns';
import DefaultTable from '../../../components/Table/DefaultTable/DefaultTable';
import api from '../../../common/Api/Api';
import {Q_EVENT_TIME_BETWEEN} from '../../../constants/query-keys';
import Filter, {initializeFilter} from '../components/Filter';

function createDayState(day) {
    const startDate = moment(new Date())
        .add(day === DAY.YESTERDAY ? -1 : 0, 'days')
        .startOf('day')
        .unix();

    const endDate = moment(new Date())
        .add(day === DAY.YESTERDAY ? -1 : 0, 'days')
        .endOf('day')
        .unix();

    return {
        data: [],
        filters: {
            [Q_EVENT_TIME_BETWEEN]: `${startDate},${endDate}`,
        },
        pagination: {
            sort: '-event_time',
            'per-page': 300,
            current: 1,
        },
    }
}

const DEFAULT_INITIAL_FILTER = {
    group: 'offer_id',
    expand: 'offer'
};

class EfficiencyAnalysisStatistics extends React.Component {

    constructor(props) {
        super(props);

        this.onFilter = onFilter.bind(this);
        this.tableColumns = getTableColumns(this);

        this.type = STATISTIC_TYPE.EFFICIENCY_ANALYSIS;

        const parsedFilters = Filters.parse();
        const filters = _.isEmpty(parsedFilters) ? DEFAULT_INITIAL_FILTER : parsedFilters;

        this.state = {
            isLoading: false,
            filters: filters,
            data: [],
            columns: [
                this.tableColumns.clickByDay,
                this.tableColumns.confirmedLeadsCountByDay,
                this.tableColumns.confirmedIncomeSumByDay,
                this.tableColumns.revshareIncomeByDay,
            ],
            isExpandedFilter: Filter.checkFiltersIsExpanded(filters),
        };

        this[DAY.TODAY] = createDayState(DAY.TODAY);
        this[DAY.YESTERDAY] = createDayState(DAY.YESTERDAY);
    }

    componentDidMount() {
        Helpers.setTitle('Анализ эффективности');

        // fetch all data for today and yesterday
        this.fetch();
    }

    fetch = async () => {
        this.setState({isLoading: true});

        const todayPromise = this.fetchDay(DAY.TODAY);
        const yesterdayPromise = this.fetchDay(DAY.YESTERDAY);

        await todayPromise;
        await yesterdayPromise;

        // merged data
        const data = this.getMergedData();

        this.setState({
            data,
            isLoading: false
        });

        Filters.toUrl(this.state.filters);

        // reset local data
        this[DAY.TODAY] = createDayState(DAY.TODAY);
        this[DAY.YESTERDAY] = createDayState(DAY.YESTERDAY);
    };

    fetchDay = (day) => {
        const {filters} = this.state;

        const dayFilters = this[day].filters;
        let dayPagination = {...this[day].pagination};

        return api.get('/v1/statistics', {
            params: {
                fields: [
                    'click',
                    'revshare_income',
                    'confirmed_leads_count',
                    'confirmed_income_sum',
                    `${filters.expand}{id,email,name}`,
                ].join(','),
                'group-by-currency': 'USD',
                sort: `-${filters.group}`,
                page: dayPagination.current,
                'per-page': dayPagination['per-page'],
                ...filters,
                ...dayFilters,
            }
        }).then(response => {
            const total = parseInt(response.headers['x-pagination-total-count']);
            const data = response.data.items;
            const dataLength = [...this[day].data, ...data].length;

            this[day] = {
                ...this[day],
                data: [...this[day].data, ...data],
            };

            // if not all data has been uploaded make a second request
            if (dataLength < total) {
                dayPagination.current = ++dayPagination.current;

                this[day] = {
                    ...this[day],
                    pagination: dayPagination
                };

                return this.fetchDay(day);
            }
        });
    };

    /**
     * Return combined data from today and yesterday data
     *
     * @return {array} result
     *
     * example output: [{today: {[identifier]: '999', ...rowData}, yesterday: {[identifier]: '999', ...rowData}}]
     */
    getMergedData = () => {
        const identifier = this.state.filters.group;
        const todayData = [...this[DAY.TODAY].data];
        const yesterdayData = [...this[DAY.YESTERDAY].data];
        const result = [];

        // walk by today data
        todayData.forEach((todayRow) => {
            // remove row data from yesterday
            const yesterdayRow = _.remove(yesterdayData, [identifier, todayRow[identifier]])[0] || {};

            result.push({
                [DAY.TODAY]: todayRow,
                [DAY.YESTERDAY]: yesterdayRow
            });
        });

        // walk by yesterday data
        yesterdayData.forEach((yesterdayRow) => {
            result.push({
                [DAY.TODAY]: {},
                [DAY.YESTERDAY]: yesterdayRow
            });
        });

        return result;
    };

    // region ---- filter handlers
    toggleFilters = () => {
        this.setState({isExpandedFilter: !this.state.isExpandedFilter});
    };

    onClearFilters = () => {
        this.setState({filters: initializeFilter(DEFAULT_INITIAL_FILTER)}, this.fetch);
    };

    // ---- endregion

    render() {
        const {data, columns, isLoading, filters, isExpandedFilter} = this.state;

        return (
            <div className="content-page">
                <Filter
                    isExpanded={isExpandedFilter}
                    onClearFilters={this.onClearFilters}
                    toggleFilters={this.toggleFilters}
                    filters={filters}
                    onSubmit={this.onFilter}
                    type={this.type}
                />

                <DefaultTable
                    loading={isLoading}
                    rowsHovered={true}
                    columnsHovered={true}
                    columns={columns}
                    dataSource={data}
                />
            </div>
        )
    }
}

export default connect(state => state)(EfficiencyAnalysisStatistics);