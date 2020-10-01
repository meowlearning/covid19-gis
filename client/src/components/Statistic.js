import React, { Component } from 'react';
import { Statistic, Row, Col, Button, Spin } from 'antd';
import "./StatisticSummary.css";

class StatisticSummary extends Component {
    state = {}

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="Statistic-summary" >
                {(this.props.data != null) ?
                    <div className="Container">
                        <Statistic title="Confirmed" value={this.props.data.confirmed} />
                        <Statistic title="Death" value={this.props.data.death} valueStyle={{ color: '#cf1322' }} />
                        <Statistic title="Recovered" value={this.props.data.recovered} valueStyle={{ color: '#3f8600' }} />
                    </div>
                    : <Spin className="Loading" tip="Loading..." />}
                <div>
                    {this.props.children}
                </div>
            </div>
        );
    }
}

export default StatisticSummary;