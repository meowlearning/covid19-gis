import React, { Component } from 'react';
import { Popover } from 'antd';
class Marker extends Component {




    render() {
        return (
            <React.Fragment>
                {this.props.visible && (
                    <Popover 
                        content={this.props.content}
                        title={this.props.title}
                        trigger="click"
                        visible={this.props.visible}
                    />
                )}
            </React.Fragment>
        )
    }
}

export default Marker;