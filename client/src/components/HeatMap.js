import React, { Component } from 'react';
import GoogleMapReact from 'google-map-react';
import Tooltip from './Tooltip';
import { Spin, Card, Select } from 'antd';
import "./HeatMap.css";

const tinygradient = require('tinygradient');
const { Option } = Select;
const Marker = props => (
    <React.Fragment>
        <div
            style={{
                border: "5px solid white",
                borderRadius: 20,
                height: 20,
                width: 20
            }}
        />
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
        let colors = null;
        let gradient = null;
        let offset = 0;
        let maxIntensity = 0;

        if (selectedCase == "Confirmed") {
            gradient = tinygradient([
                "#659BDF",
                "#4467C4",
                '#2234A8',
                '#00008C'
            ]);

            offset = 300;
            maxIntensity = 300000;
        } else if (selectedCase == "Incidence") {
            gradient = tinygradient([
                { color: '#FFA12C', pos: 0 },
                { color: '#FE612C', pos: 0.1 },
                { color: '#F11D28', pos: 1 }
            ]);

            offset = 2.4;
            maxIntensity = 2400;
        } else if (selectedCase == "Active") {
            gradient = tinygradient([
                "#B7FFBF",
                "#95F985",
                "#4DED30",
                '#26D701',
                '#00C301',
                '#00AB08'
            ]);

            offset = 300;
            maxIntensity = 300000;
        } else if (selectedCase == "Fatality") {
            gradient = tinygradient([
                '#FFB7C5',
                '#7A5AC2',
                '#663398'
            ])

            offset = 0.015;
            maxIntensity = 15;
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
                    radius: 15,
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
            <Card title="Geographic Information System" extra={<Tooltip info={this.state.info} />}>
                <Select defaultValue={this.state.SelectedCase} style={{ width: 150 }} onChange={this.handleSelectedCaseChange}>
                    {this.state.options.case.map((c) => {
                        return <Option value={c.value}>{c.text}</Option>
                    })}
                </Select>

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
            </Card>
        );
    }
}

export default HeatMap;