import React, { Component } from 'react';
import HeatMap from './components/HeatMap';
import Graph from './components/Graph';
import StatisticSummary from './components/Statistic';
import { Layout, Select, Popover } from 'antd';
import './App.css';
const CountryOtions = require('./components/data/CountryCoord.json');
const axios = require("axios").default;
const { Header, Footer, Content, Sider } = Layout;
const { Option } = Select;



class App extends Component {

  state = {
    data: {
      statistic: null,
      map: null
    },
    selected: {
      map: {
        lat: 0,
        lng: 0,
        zoom: 0
      },
      selectedCase: "Confirmed",
    }
  }

  constructor() {
    super();
    this.handleCountryOptionChange = this.handleCountryOptionChange.bind(this);
  }


  componentDidMount() {
   
    let data = sessionStorage.getItem("covid19-data");
    if (data) { // if data exist use the data
      data = JSON.parse(data);
      this.setState({
        data: data
      })
    } else { // if data is not exist in session storage fetch the data from the server
      axios.get("/api/data")
        .then(({ data }) => {
          // construct the data
          let positions = [];
          let confirmedCaseTotal = 0;
          let deathCaseTotal = 0;
          let recoveredCaseTotal = 0;

          data.data.map((d) => {
            // data for Heatmap
            if (d.data.location !== null) {
              positions.push({ lat: d.data.location.coordinates[1], lng: d.data.location.coordinates[0] })
            }
            // data for statistic
            confirmedCaseTotal += d.data.case.confirmed;
            deathCaseTotal += d.data.case.death;
            recoveredCaseTotal += d.data.case.recovered;
          });

          // construct the data for the Heatmap
          let tempData = {
            map: {
              positions: positions,
              options: {
                radius: 20
              }
            },
            statistic: {
              confirmed: confirmedCaseTotal,
              death: deathCaseTotal,
              recovered: recoveredCaseTotal
            }
          }

          this.setState({
            data: tempData
          })

          // store data in session storage for later use
          sessionStorage.setItem("covid19-data", JSON.stringify(tempData));
        });
    }
  }


  handleCountryOptionChange(value) {
    // get the coord of the selected value
    let lng = 0;
    let lat = 0;

    for (let i = 0; i < CountryOtions.length; i++) {
      if (CountryOtions[i].name === value) {
        lng = CountryOtions[i].latlng[1]
        lat = CountryOtions[i].latlng[0]
        break;
      }
    }

    // store the data in the session  
    sessionStorage.setItem("selected-country-option", JSON.stringify(value));
    sessionStorage.setItem("selected-country-lat", JSON.stringify(lat));
    sessionStorage.setItem("selected-country-lng", JSON.stringify(lng));
    sessionStorage.setItem("selected-country-zoom", JSON.stringify(5));

    // set the state
    this.setState({
      selected: {
        CountryOtions: value,
        map: {
          lat: lat,
          lng: lng,
          zoom: 5
        }
      }
    });
  }

 

  render() {
    return (
      <Layout>
        <Header><h1 style={{ color: "white" }}>COVID-19</h1></Header>
        <Layout>
          <Sider>
            <h1 style={{ color: "white" }}>Country: </h1>
            <Select defaultValue={this.state.selected.countryOption} style={{ width: 120 }} onChange={this.handleCountryOptionChange}>
              {CountryOtions.map((country) => {
                return <Option value={country.name}>{country.name}</Option>
              })}
            </Select>
          </Sider>
          <Content>
            <HeatMap coordinates={this.state.data.map}
              lat={this.state.selected.map.lat}
              lng={this.state.selected.map.lng}
              zoom={this.state.selected.map.zoom}
              countryName={this.state.selected.countryOption}
            />
          </Content>
        </Layout>
        <Footer>
          <Graph selectedCountry={this.state.selected.countryOption} selectedCase={this.state.selected.selectedCase} />
          <br />
          <br />
          <StatisticSummary data={this.state.data.statistic} />
        </Footer>
      </Layout>

    );
  }
}

export default App;
