import React, { Component } from 'react'
import { Card } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import Tooltip from "./Tooltip";

class CountryInfo extends Component {
    
    state = {
        info: "This is for selected country Information"
    }

    componentDidMount(){
        
    }

    componentDidUpdate(prevProps){
        if(prevProps.selectedCountry !== this.props.selectedCountry){

        }
    }

    
    render() {
        return (
            <Card title={`Country Info -- ${this.props.selectedCountry}`} extra={<Tooltip info={this.state.info}/>}>
                <div className="country-info-container" style={{ width: "100%", height: "50vh" }}>

                </div>
            </Card>
        )
    }
}

export default CountryInfo;