import React, { Component } from 'react';
import GoogleMapReact from 'google-map-react';
import Tooltip from './Tooltip';
import { Spin, Card } from 'antd';
import "./HeatMap.css";


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


const Dot = props => (
    <React.Fragment>
        <span class="dot" style={{
            height: props.radius / 10,
            width: props.radius /10
        }} />
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
        }
    }


    constructor() {
        super();
    }


    componentDidUpdate(prevProps) {
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


    render() {
        return (
            <Card title="Geographic Information System" extra={<Tooltip info={this.state.info}/>}>
                <div className="Map" style={{ height: "50vh", width: "100%" }}>
                    {(this.props.coordinates != null) ?
                        <GoogleMapReact
                            bootstrapURLKeys={{ key: this.state.API_KEY.google }}
                            defaultCenter={this.state.default.map.center}
                            center={this.state.selected.map.center}
                            zoom={this.state.selected.map.zoom}
                            defaultZoom={this.state.default.map.zoom}
                            heatmapLibrary={true}
                            heatmap={this.props.coordinates}
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