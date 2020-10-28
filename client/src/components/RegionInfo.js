import React, { Component } from 'react'
import { Spin, Card, Breadcrumb, Statistic, Row, Col, Empty } from 'antd';
import CustomTooltip from "./CustomTooltip";




class RegionInfo extends Component {

    state = {
        info: "This is for selected region information",
        loading: false,
        dataUnavailable: true,
    }

    constructor() {
        super();
        this.NoSelectedRegion = this.NoSelectedRegion.bind(this);
    }

    componentDidMount() {

    }

    componentDidUpdate(prevProps) {
        if (prevProps.data !== this.props.data) {
            if (this.props.data === null) {
                this.setState({
                    loading: true,
                    dataUnavailable: false
                })
            }
            else if (this.props.data === undefined) {
                this.setState({
                    loading: false,
                    dataUnavailable: true
                })
            }
            else {
                this.setState({
                    loading: false,
                    dataUnavailable: false
                })
            }
        }
    }

    NoSelectedRegion() {
        if (this.state.dataUnavailable) {
            return <div style={{
                height: "10em",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                <Empty />
            </div>
        } else if (this.state.loading) {
            return <div style={{
                height: "10em",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                <Spin className="Loading" tip="Loading..." />
            </div>
        }

        return <div style={{
            height: "10em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
        }}>
            <Spin className="Loading" tip="Loading..." />
        </div>
    }

    render() {

        const vgutter = 16;
        const hgutter = 16;

        return (
            <Card title={`Regional Info`} extra={<CustomTooltip info={this.state.info} />}>
                <div className="region-info-container" style={{ width: "100%", height: "50vh" }}>
                    {
                        (!this.state.loading && !this.state.dataUnavailable && this.props.data) ?
                            <div>
                                <Row gutter={[vgutter, hgutter]}>
                                    <Col span={24}>
                                        <b style={{ fontSize: "15px", float: "left" }}>Location:&nbsp;</b>
                                        <Breadcrumb separator=">" >
                                            <Breadcrumb.Item>{this.props.country}</Breadcrumb.Item>
                                            <Breadcrumb.Item>{this.props.state}</Breadcrumb.Item>
                                            <Breadcrumb.Item>{this.props.county}</Breadcrumb.Item>
                                        </Breadcrumb>
                                    </Col>
                                </Row>
                                <Row gutter={[vgutter, hgutter]} justify="center" align="middle">
                                    <Col span={12}><Statistic title="Population" value={this.props.data.population} /> </Col>
                                    <Col span={12}><Statistic title="Active" value={this.props.data.active} /> </Col>
                                </Row>
                                <Row gutter={[vgutter, hgutter]} justify="center" align="middle">
                                    <Col span={12} ><Statistic title="Weekly Confirmed" value={this.props.data.weekly_confirmed} /> </Col>
                                    <Col span={12} > <Statistic title="Weekly Death" value={this.props.data.weekly_deaths} /> </Col>
                                </Row>
                                <Row gutter={[vgutter, hgutter]} justify="center" align="middle">
                                    <Col span={12} > <Statistic title="Confirmed" value={this.props.data.confirmed} /> </Col>
                                    <Col span={12} ><Statistic title="Deaths" value={this.props.data.deaths} /> </Col>
                                </Row>
                                <Row gutter={[vgutter, hgutter]} justify="center" align="middle">
                                    <Col span={12} > <Statistic title="Recovered" value={this.props.data.recovered} /> </Col>
                                    <Col span={12} > <Statistic title="Incidence (per 100k people)" value={this.props.data.incidence.toFixed(2)} /> </Col>
                                </Row>
                                <Row gutter={[vgutter, hgutter]} justify="center" align="middle">
                                    <Col span={24} > <Statistic title="Case-Fatality Rate" value={`${this.props.data.fatality.toFixed(2)}%`} /> </Col>
                                </Row>
                            </div>
                            : <this.NoSelectedRegion />
                    }
                </div>
            </Card>
        )
    }
}

export default RegionInfo;