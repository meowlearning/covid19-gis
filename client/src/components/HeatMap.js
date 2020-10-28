import React, { Component } from 'react';
import GoogleMapReact from 'google-map-react';
import CustomTooltip from './CustomTooltip';
import { Spin, Card, Select, Row, Col, Button } from 'antd';
import { EnvironmentFilled, CompassOutlined } from "@ant-design/icons";
import "./HeatMap.css";

const tinygradient = require('tinygradient');
const { Option } = Select;


const Marker = props => (
    <React.Fragment>
        <EnvironmentFilled style={{ fontSize: '30px' }} />
    </React.Fragment>
)

class HeatMap extends Component {
    state = {
        API_KEY: {
            google: process.env.REACT_APP_GOOGLE_API || "AIzaSyA-AXXI0TXe55-vlmyJPOFg8gL5bnATQMY"
        },
        info: "This show the Situation in around the world",
        pos: {
            center: {
                lat: 0,
                lng: 0
            },
            zoom: 0
        },
        SelectedCase: "confirmed",
        options: {
            case: [
                {
                    value: "confirmed",
                    text: "Confirmed"
                },
                {
                    value: "active",
                    text: "Active"
                },
                {
                    value: "incidence",
                    text: "Incidence rate"
                },
                {
                    value: "fatality",
                    text: "Case-fatality ratio"
                },
            ]
        },
        heatmap: null,
        map: null,
        maps: null
    }


    constructor() {
        super();
        this.handleSelectedCaseChange = this.handleSelectedCaseChange.bind(this);
        this.processData = this.processData.bind(this);
        this.initMap = this.initMap.bind(this);
        this.handleLocationError = this.handleLocationError.bind(this);
        this.getCurPos = this.getCurPos.bind(this);
    }

    componentDidMount() {
        this.processData(this.state.SelectedCase)
    }

    handleLocationError(
        browserHasGeolocation, infoWindow, pos
    ) {
        infoWindow.setPosition(pos);
        infoWindow.setContent(
            browserHasGeolocation
                ? "Error: The Geolocation service failed."
                : "Error: Your browser doesn't support geolocation."
        );
        infoWindow.open(this.state.map);
    }

    getCurPos() {
        const infoWindow = new this.state.maps.InfoWindow();
        const geocoder = new this.state.maps.Geocoder();

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    }

                    geocoder.geocode({ location: pos }, (results, status) => {
                        if (status === "OK") {
                            if (results[0]) {
                                let country = results[0].address_components.find(a => a.types[0] === "country");
                                let state = results[0].address_components.find(a => a.types[0] === "administrative_area_level_1");
                                let county = results[0].address_components.find(a => a.types[0] === "administrative_area_level_2");
                                this.props.handleGPSClick({
                                    country: country ? country.long_name : '',
                                    state: state ? state.long_name : '',
                                    county: county ? county.long_name : '',
                                    lat: pos.lat,
                                    lng: pos.lng,
                                    zoom: 10
                                })
                            } else {
                                window.alert("No results found");
                            }
                        } else {
                            window.alert("Geocoder failed due to: " + status);
                        }
                    });

                }, () => {
                    this.handleLocationError(true, infoWindow, this.state.map.getCenter());
                }
            )
        } else {
            this.handleLocationError(false, infoWindow, this.state.map.getCenter());
        }
    }

    initMap({ map, maps }) {
        this.setState({
            map: map,
            maps: maps
        })
    };

    processData(selectedCase) {
        let colors;
        let gradient;
        let offset;
        let maxIntensity;
        let radius = 15;

        if (selectedCase === "confirmed") {
            gradient = tinygradient([
                "#659BDF",
                "#4467C4",
                '#2234A8',
                '#00008C'
            ]);

            // radius = 15;
            offset = 300;
            maxIntensity = 300000;
        } else if (selectedCase === "incidence") {
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
        } else if (selectedCase === "active") {
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
        } else if (selectedCase === "fatality") {
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
                weight: (d[selectedCase] || 0) > 0 ? d[selectedCase] + offset : 0
            }
        ))

        this.setState({
            heatmap: {
                positions: position_and_intensity,
                options: {
                    radius: radius,
                    maxIntensity: maxIntensity,
                    opacity: 0.7,
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
                pos: {
                    center: {
                        lat: this.props.lat,
                        lng: this.props.lng
                    },
                    zoom: this.props.zoom
                },
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
                                return <Option key={c.value} value={c.value}>{c.text}</Option>
                            })}
                        </Select>
                        <Button
                            disabled={!this.state.map && !this.state.maps}
                            type="primary"
                            size='middle'
                            icon={<CompassOutlined />}
                            onClick={this.getCurPos}
                            style={{ float: "right" }}
                        >Use My Location</Button>
                    </Col>
                </Row>
                <Row gutter={[8, 24]}>
                    <Col span={24} >
                        <div className="Map" style={{ height: "50vh", width: "100%" }}>
                            {(this.state.heatmap != null) ?
                                <GoogleMapReact
                                    bootstrapURLKeys={{ key: this.state.API_KEY.google }}
                                    defaultCenter={this.state.pos.center}
                                    center={this.state.pos.center}
                                    zoom={this.state.pos.zoom}
                                    defaultZoom={this.state.pos.zoom}
                                    heatmapLibrary={true}
                                    heatmap={this.state.heatmap}
                                    yesIWantToUseGoogleMapApiInternals
                                    onGoogleApiLoaded={this.initMap}
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