import React, { Component } from 'react'
import { Card, Breadcrumb, Statistic, Row, Col, Empty, Divider } from 'antd';
import CustomTooltip from "./CustomTooltip";


const NoSelectedRegion = () => (
    <div className="no-selected-region" style={{
        height: "10em",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    }}>
        <Empty description={"Please Select Region"} />
    </div>
)


class CountryInfo extends Component {

    state = {
        info: "This is for selected country Information",
        loading: true
    }

    componentDidMount() {

    }

    componentDidUpdate(prevProps) {

    }


    render() {

        const vgutter = 16;
        const hgutter = 16;

        return (
            <Card title={`Regional Info`} extra={<CustomTooltip info={this.state.info} />}>
                <div className="country-info-container" style={{ width: "100%", height: "50vh" }}>
                    {this.props.data !== null ?
                        <div>
                            <Row gutter={[vgutter, hgutter]}>
                                <Col span={4} >
                                    <Breadcrumb separator="">
                                        <Breadcrumb.Item>Location</Breadcrumb.Item>
                                        <Breadcrumb.Separator>:</Breadcrumb.Separator>
                                    </Breadcrumb>
                                </Col>
                                <Col span={20} >
                                    <Breadcrumb separator=">">
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
                        : <NoSelectedRegion />}
                </div>
            </Card>
        )
    }
}

export default CountryInfo;