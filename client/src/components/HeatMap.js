import React, { Component } from 'react';
import GoogleMapReact from 'google-map-react';
import CustomTooltip from './CustomTooltip';
import { Spin, Card, Select, Row, Col } from 'antd';
import { CaretDownOutlined } from "@ant-design/icons";
import "./HeatMap.css";

const tinygradient = require('tinygradient');
const { Option } = Select;


const Marker = props => (
    <React.Fragment>
        <CaretDownOutlined style={{fontSize: '30px'}}/>
    </React.Fragment>
)

class HeatMap extends Component {
    state = {
        API_KEY: {
            google: process.env.REACT_APP_GOOGLE_API || "AIzaSyA-AXXI0TXe55-vlmyJPOFg8gL5bnATQMY"
        },
        info: "This show the Situation in around the world",
        default: {
            map: {
                center: {
                    lat: 0,
                    lng: 0,
                },
                zoom: 0
            }
        },
        selected: {
            map: {
                center: {
                    lat: 0,
                    lng: 0
                },
                zoom: 0
            },
            countryName: null
        },
        ref: {
            maps: null,
            map: null,
            infoWindow: null,
            marker: null
        },
        SelectedCase: "Confirmed",
        options: {
            case: [
                {
                    value: "Confirmed",
                    text: "Confirmed"
                },
                {
                    value: "Active",
                    text: "Active"
                },
                {
                    value: "Incidence",
                    text: "Incidence rate"
                },
                {
                    value: "Fatality",
                    text: "Case-fatality ratio"
                },
            ]
        },
        map: null
    }


    constructor() {
        super();
        this.handleSelectedCaseChange = this.handleSelectedCaseChange.bind(this);
        this.processData = this.processData.bind(this);
    }

    componentDidMount() {
        this.processData(this.state.SelectedCase)
    }

    processData(selectedCase) {
        let colors;
        let gradient;
        let offset;
        let maxIntensity;
        let radius = 15;

        if (selectedCase === "Confirmed") {
            gradient = tinygradient([
                "#659BDF",
                "#4467C4",
                '#2234A8',
                '#00008C'
            ]);

            // radius = 15;
            offset = 300;
            maxIntensity = 300000;
        } else if (selectedCase === "Incidence") {
            gradient = tinygradient([
                '#FF8B01',
                '#FA6F01',
                '#F55301',
                '#F03801',
                '#EB1C01',
                '#E60001'
            ]);

            // radius = 10;
            offset = 5;
            maxIntensity = 5000;
        } else if (selectedCase === "Active") {
            gradient = tinygradient([
                "#B7FFBF",
                "#95F985",
                "#4DED30",
                '#26D701',
                '#00C301',
                '#00AB08'
            ]);

            // radius = 15;
            offset = 300;
            maxIntensity = 300000;
        } else if (selectedCase === "Fatality") {
            gradient = tinygradient([
                '#FB8CAB',
                '#E65C9C',
                '#CF268A',
                '#AF1281',
                '#6B0772',
                '#360167'
            ])

            // radius = 10;
            offset = 0.03;
            maxIntensity = 30;
        }

        colors = gradient.rgb(1000).map(t => t.toHexString());
        colors.unshift("rgba(0, 0, 0, 0)");

        let position_and_intensity = this.props.gis.map(d => (
            {
                lat: d.coords[1],
                lng: d.coords[0],
                weight: (d[selectedCase.toLowerCase()] || 0) ? d[selectedCase.toLowerCase()] + offset : 0
            }
        ))

        this.setState({
            map: {
                positions: position_and_intensity,
                options: {
                    radius: radius,
                    maxIntensity: maxIntensity,
                    opacity: 1,
                    gradient: colors,
                }
            }
        })
    }

    componentDidUpdate(prevProps) {
        if ((prevProps.gis !== this.props.gis)) {
            this.processData(this.state.SelectedCase);
        }

        if ((prevProps.lat !== this.props.lat) || (prevProps.lng !== this.props.lng)) {
            this.setState({
                selected: {
                    map: {
                        center: {
                            lat: this.props.lat,
                            lng: this.props.lng
                        },
                        zoom: this.props.zoom
                    },
                    countryName: this.props.countryName
                }
            })
        }
    }

    handleSelectedCaseChange(value) {
        this.processData(value);
        this.setState({
            SelectedCase: value
        })
    }


    render() {
        return (
            <Card title="Geographic Information System" extra={<CustomTooltip info={this.state.info} />}>
                <Row gutter={[8, 24]}>
                    <Col span={24} >
                        <Select defaultValue={this.state.SelectedCase} style={{ width: 150 }} onChange={this.handleSelectedCaseChange}>
                            {this.state.options.case.map((c) => {
                                return <Option value={c.value}>{c.text}</Option>
                            })}
                        </Select>
                    </Col>
                </Row>
                <Row gutter={[8, 24]}>
                    <Col span={24} >
                        <div className="Map" style={{ height: "50vh", width: "100%" }}>
                            {(this.state.map != null) ?
                                <GoogleMapReact
                                    bootstrapURLKeys={{ key: this.state.API_KEY.google }}
                                    defaultCenter={this.state.default.map.center}
                                    center={this.state.selected.map.center}
                                    zoom={this.state.selected.map.zoom}
                                    defaultZoom={this.state.default.map.zoom}
                                    heatmapLibrary={true}
                                    heatmap={this.state.map}
                                >

                                    {((this.props.lat !== 0) && (this.props.lng !== 0)) ?
                                        <Marker
                                            lat={this.props.lat}
                                            lng={this.props.lng}
                                        /> : null
                                    }

                                </GoogleMapReact>
                                : <Spin className="Loading" tip="Loading..." />}
                        </div>
                    </Col>
                </Row>
            </Card>
        );
    }
}

export default HeatMap;