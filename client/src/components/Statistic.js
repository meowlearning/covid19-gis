import React, { Component } from 'react';
import { ResponsiveBar } from '@nivo/bar'
import { Statistic, Spin, Card, Divider, Row, Col, Empty } from 'antd';
import CustomTooltip from './CustomTooltip';
import "./StatisticSummary.css";

class StatisticSummary extends Component {
    state = {
        info: "This gives summary of the selected region situation",
        data: null,
        loading: false,
        dataUnavailable: true
    }

    componentDidUpdate(prevProps) {
        if (prevProps.data !== this.props.data) {
            if (this.props.data === null) { // loading
                this.setState({
                    loading: true,
                    dataUnavailable: false
                })
            } else if (this.props.data === undefined) { // data unavailable
                this.setState({
                    loading: false,
                    dataUnavailable: true
                })
            } else { // data available
                this.setState({
                    loading: false,
                    dataUnavailable: false,
                    data: [
                        {
                            "case": "Confirmed",
                            "Confirmed": this.props.data.confirmed,
                            "color": "#8dd3c7"
                        }, {
                            "case": "Active",
                            "Active": this.props.data.active,
                            "color": "#fb8072"
                        }, {
                            "case": "Recovered",
                            "Recovered": this.props.data.recovered,
                            "color": "#bebada"
                        }, {
                            "case": "Deaths",
                            "Deaths": this.props.data.deaths,
                            "color": "#ffb300"
                        }
                    ]
                })
            }
        }
    }

    render() {
        return (
            <Card title="Region Statistic" extra={<CustomTooltip info={this.state.info} />}>

                <div
                    className="graph-summary"
                    style={{
                        width: "100%",
                        height: "36.3vh",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center"
                    }}
                >
                    {!this.state.loading ?
                        !this.state.dataUnavailable && this.props.data ?
                            <ResponsiveBar
                                data={this.state.data}
                                keys={this.state.data.map(c => c.case)}
                                indexBy="case"
                                colors={this.state.data.map(c => c.color)}
                                labelTextColor="none"
                                animate={true}
                                motionStiffness={115}
                                motionDamping={15}
                            />
                            : <Empty />
                        : <Spin className="Loading" tip="Loading..." />
                    }
                </div>

                <Divider type="horizontal" />
                <br />
                <br />
                <div className="Statistic-summary" >
                    {!this.state.loading ?
                        !this.state.dataUnavailable && this.props.data ?
                            <div className="Container">
                                <Row gutter={[48, 48]}>
                                    <Col key="Confirmed" span={12}>
                                        <Statistic title="Confirmed" value={this.props.data.confirmed} valueStyle={{ color: this.state.data.find(c => c.case === "Confirmed").color }} />
                                    </Col>
                                    <Col key="Deaths" span={12}>
                                        <Statistic title="Deaths" value={this.props.data.deaths} valueStyle={{ color: this.state.data.find(c => c.case === "Deaths").color }} />
                                    </Col>
                                </Row>
                                <Row gutter={[48, 48]}>
                                    <Col key="Recovered" span={12}>
                                        <Statistic title="Recovered" value={this.props.data.recovered} valueStyle={{ color: this.state.data.find(c => c.case === "Recovered").color }} />
                                    </Col>
                                    <Col key="Active" span={12}>
                                        <Statistic title="Active" value={this.props.data.active} valueStyle={{ color: this.state.data.find(c => c.case === "Active").color }} />
                                    </Col>
                                </Row>
                            </div>
                            : <Empty />
                        : <Spin className="Loading" tip="Loading..." />}
                </div>
            </Card>
        );
    }
}

export default StatisticSummary;