import React, { Component } from 'react'
import { InfoCircleOutlined } from '@ant-design/icons';
import './Tooltip.css'

class Tooltip extends Component {
    render() {
        return (
            <div className="tooltip">
                <InfoCircleOutlined />
                <span className="tooltiptext">{this.props.info}</span>
            </div>
        )
    }
}


export default Tooltip;