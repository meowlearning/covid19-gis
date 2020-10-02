import React, { Component } from 'react';
import HeatMap from './components/HeatMap';
import Graph from './components/Graph';
import StatisticSummary from './components/Statistic';
import CountryInfo from './components/CountryInfo';
import { Layout, Select, Row, Col } from 'antd';
import './App.css';
const CountryOtions = require('./components/data/CountryCoord.json');
const axios = require("axios").default;
const { Header, Footer, Content, Sider } = Layout;
const { Option } = Select;

const fs = require('fs');

class App extends Component {

  state = {
    data: {
      statistic: null,
      map: null
    },
    countries: [],
    selected: {
      map: {
        lat: 0,
        lng: 0,
        zoom: 0
      },
    },
    SelectedCase: "Confirmed",
    SelectedCountry: "Global",
    options: {
      case: ["Confirmed", "Deaths", "Recovered"]
    }
  }

  constructor() {
    super();
    this.handleCountryOptionChange = this.handleCountryOptionChange.bind(this);
    this.handleSelectedCaseChange = this.handleSelectedCaseChange.bind(this);
    this.getGISData = this.getGISData.bind(this);
  }


  getGISData(selectedCase) {
    axios.get('/api/gis')
      .then(({ data }) => {
        console.log(data)
        let result = data.result;
        let positions_and_intensity = [];
        let confirmedCaseTotal = 0;
        let deathCaseTotal = 0;
        let recoveredCaseTotal = 0;
        let activeCaseTotal = 0;

        result.map((d) => {
          positions_and_intensity.push({ lat: d.coords[1], lng: d.coords[0], intensity: d[selectedCase.toLowerCase()] })
          confirmedCaseTotal += d.confirmed || 0;
          deathCaseTotal += d.deaths || 0;
          recoveredCaseTotal += d.recovered;
          activeCaseTotal += d.active;
        })



        console.log(positions_and_intensity);

        // construct the data for the Heatmap
        let tempData = {
          map: {
            positions: positions_and_intensity,
            options: {
              radius: 20
            }
          },
          statistic: {
            confirmed: confirmedCaseTotal,
            death: deathCaseTotal,
            recovered: recoveredCaseTotal,
            active: activeCaseTotal
          }
        }

        this.setState({
          data: tempData
        })

        // store data in session storage for later use
        sessionStorage.setItem("covid19-data", JSON.stringify(tempData));
      });
  }

  componentDidMount() {

    let data = sessionStorage.getItem("covid19-data");
    if (data) { // if data exist use the data
      data = JSON.parse(data);
      this.setState({
        data: data
      })
    } else { // if data is not exist in session storage fetch the data from the server
      this.getGISData(this.state.SelectedCase);
    }

    // get countries
    let countries = sessionStorage.getItem("countries");
    if (countries) {
      countries = JSON.parse(countries);
      this.setState({
        countries: countries
      })
    } else {
      axios.get('/api/countries')
        .then(async ({ data }) => {

          // set countries
          this.setState({
            countries: data.countries
          })

          // store data in session storage for later use
          sessionStorage.setItem("countries", JSON.stringify(data.countries))
        });
    }
  }

  handleSelectedCaseChange(value) {
    this.getGISData(value);
    this.setState({
      SelectedCase: value
    })
  }

  handleCountryOptionChange(value) {
    // // get the coord of the selected value
    // let lat = 0;
    // let lng = 0;

    axios.get(`/api/loc?country=${value}`)
      .then(async ({ data }) => {
        // set the state
        this.setState({
          selected: {
            map: {
              lat: data.coords[0],
              lng: data.coords[1],
              zoom: 5,
            }
          },
          countryOption: value
        })
      })

    // for (let i = 0; i < CountryOtions.length; i++) {
    //   if (CountryOtions[i].name === value) {
    //     lng = CountryOtions[i].latlng[1]
    //     lat = CountryOtions[i].latlng[0]
    //     break;
    //   }
    // }

    // // set the state
    // this.setState({
    //   selected: {
    //     map: {
    //       lat: lat,
    //       lng: lng,
    //       zoom: 5
    //     }
    //   },
    //   countryOption: value
    // });
  }


  render() {
    return (
      <Layout>
        <Header><h1 style={{ color: "white" }}>COVID-19</h1></Header>
        <Layout>
          <Sider>
            <Row gutter={[8, 24]}>
              <Col key="Country-Selection" span={6}>
                <h1 style={{ color: "white" }}>Country: </h1>
                <Select defaultValue={this.state.SelectedCountry} style={{ width: 150 }} onChange={this.handleCountryOptionChange}>
                  {this.state.countries.map((country) => {
                    return <Option value={country}>{country}</Option>
                  })}
                </Select>
              </Col>
            </Row>
            <Row gutter={[8, 24]}>
              <Col key="Case-Selection" span={6}>
                <h1 style={{ color: "white" }}>Case: </h1>
                <Select defaultValue={this.state.SelectedCase} style={{ width: 150 }} onChange={this.handleSelectedCaseChange}>
                  {this.state.options.case.map((c) => {
                    return <Option value={c}>{c}</Option>
                  })}
                </Select>
              </Col>
            </Row>


          </Sider>
          <Layout>
            <Content>
              <Row gutter={[8, 8]}>
                <Col key="Heatmap" span={18}>
                  <HeatMap coordinates={this.state.data.map}
                    lat={this.state.selected.map.lat}
                    lng={this.state.selected.map.lng}
                    zoom={this.state.selected.map.zoom}
                  />
                </Col>
                <Col key="Country-Info" span={6}>
                  <CountryInfo
                    selectedCountry={this.state.SelectedCountry}
                  />
                </Col>
              </Row>
              <Row gutter={[8, 8]}>
                <Col key="Selected-Country-Graph" span={18}>
                  <Graph
                    selectedCountry={this.state.SelectedCountry}
                    selectedCase={this.state.SelectedCase} />
                </Col>
                <Col key="World-Info" span={6}>
                  <StatisticSummary
                    data={this.state.data.statistic} />
                </Col>
              </Row>

            </Content>
            <Footer>

            </Footer>
          </Layout>
        </Layout>
      </Layout>

    );
  }
}

export default App;
