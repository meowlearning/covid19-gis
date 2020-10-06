import React, { Component } from 'react';
import HeatMap from './components/HeatMap';
import Graph from './components/Graph';
import StatisticSummary from './components/Statistic';
import CountryInfo from './components/CountryInfo';
import { Layout, Select, Row, Col, Tabs, Menu } from 'antd';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
const CountryOtions = require('./components/data/CountryCoord.json');
const axios = require("axios").default;
const { Header, Footer, Content, Sider } = Layout;
const { Option } = Select;
const { TabPane } = Tabs;


class App extends Component {

  state = {
    statistic: null,
    countries: [],
    states: [],
    counties: [],
    selected: {
      map: {
        lat: 0,
        lng: 0,
        zoom: 0
      },
    },
    SelectedCountry: "Global",
    SelectedState: "",
    SelectedCounty: "",
    gis: [],
    regionInfo: null,
    graphData: null
  }

  constructor() {
    super();
    this.handleCountryOptionChange = this.handleCountryOptionChange.bind(this);
    this.getGISData = this.getGISData.bind(this);
    this.getGlobalInfo = this.getGlobalInfo.bind(this);
    this.getRegions = this.getRegions.bind(this);
    this.getRegionInfo = this.getRegionInfo.bind(this);
    this.handleStateOptionChange = this.handleStateOptionChange.bind(this);
    this.handleCountyOptionChange = this.handleCountyOptionChange.bind(this);
  }


  getGISData() {
    // get gis data and update state
    axios.get('/api/gis')
      .then(async ({ data }) => {
        // construct the data for the Heatmap
        this.setState({
          gis: data.result
        }, () => console.log(this.state.gis))
      })
      .catch(err => console.log(err))
  }

  getGlobalInfo() {
    axios.get('/api/globalinfo')
      .then(async ({ data }) => {
        // construct the data for the statistic
        let statistic = {
          confirmed: data.confirmed,
          deaths: data.deaths,
          recovered: data.recovered,
          active: data.active,
          incidence: data.incidence
        }

        this.setState({
          statistic: statistic
        })

        // store data in session storage for later use
        sessionStorage.setItem("covid19-statistic", JSON.stringify(statistic));
      })
      .catch(err => console.log(err))
  }

  /**
   * This will get the regions based on given context.
   * if country is not defined return every countries
   * if country is defined and state is not defined return all states of given country
   * if country and state is defined return all counties of given country and state
   * @param {String} country specify this to get states
   * @param {String} state specify this and country to get counties
   * @returns {Promise} Promise resolves into an array of regions and their locations
   */
  getRegions(country, state) {
    country = country === undefined ? '' : country;
    state = state === undefined ? '' : state;

    return axios.get(`/api/regions?country=${country}&state=${state}`)
  }

  getRegionInfo(country, state, county) {
    state = state === undefined ? '' : state;
    county = county === undefined ? '' : county;

    return axios.get(`/api/graphinfo?country=${country}&state=${state}&county=${county}`)
  }

  componentDidMount() {

    let statistic = sessionStorage.getItem("covid19-statistic");
    if (statistic) { // if data statistic exist use the data
      statistic = JSON.parse(statistic);
      this.setState({
        statistic: statistic
      })
    } else { // if data statistic does not exist in session storage fetch the data from the server
      this.getGlobalInfo();
    }

    this.getGISData();

    // get countries
    let countries = sessionStorage.getItem("countries");
    if (countries) {
      countries = JSON.parse(countries);
      this.setState({
        countries: countries
      })
    } else {
      this.getRegions()
        .then(async ({ data }) => {

          // set countries
          this.setState({
            countries: data.result,
          })

          // store data in session storage for later use
          sessionStorage.setItem("countries", JSON.stringify(data.result))
        })
        .catch(err => console.log(err))
    }
  }

  handleCountryOptionChange(value) {
    // set the state of graphdata to null
    this.setState({
      regionInfo: null,
      graphData: null
    })

    // get the country
    let country = value.key;

    // get the location and center on the map
    const data = this.state.countries.find(({ _id }) => _id.country == country);
    this.setState({
      selected: {
        map: {
          lat: data.lat,
          lng: data.lng,
          zoom: 5,
        }
      },
    })

    // change states list
    this.getRegions(country)
      .then(({ data }) => {
        // set states
        this.setState({
          states: data.result
        })
      })
      .catch(err => console.log(err))

    // set state for selected country
    this.setState({
      SelectedCountry: country
    })

    // get country info and graph info
    this.getRegionInfo(country)
      .then(({ data }) => {
        this.setState({
          graphData: data.result,
          regionInfo: data.result[data.result.length - 1]
        })
      })
  }

  handleStateOptionChange(value) {
    // initialize graph data to null
    this.setState({
      regionInfo: null,
      graphData: null
    })

    // get state
    let state = value.key;

    // center into the state location
    const data = this.state.states.find(({ _id }) => _id.state == state);
    this.setState({
      selected: {
        map: {
          lat: data.lat,
          lng: data.lng,
          zoom: 5,
        }
      },
    })

    // get all counties for the counties list
    this.getRegions(this.state.SelectedCountry, state)
      .then(({ data }) => {
        // set the counties
        this.setState({
          counties: data.result
        })
      })
      .catch(err => console.log(err))

    // set selected state
    this.setState({
      SelectedState: state
    })

    // get state's graphinfo
    this.getRegionInfo(this.state.SelectedCountry, state)
      .then(({ data }) => {
        this.setState({
          graphData : data.result,
          regionInfo: data.result[data.result.length - 1]
        })
      })
  }

  handleCountyOptionChange(value) {
    // initialize the graph data and region info to null
    this.setState({
      regionInfo: null,
      graphData: null
    })

    // get the county's name
    let county = value.key;
    
    // center into the state location
    const data = this.state.states.find(({ _id }) => _id.county == county);
    this.setState({
      selected: {
        map: {
          lat: data.lat,
          lng: data.lng,
          zoom: 5,
        }
      },
    })
    
    // set selected county
    this.setState({
      SelectedCounty: county
    })

    // get county's graphinfo
    this.getRegionInfo(this.state.SelectedCountry, this.state.SelectedState, county)
      .then(({ data }) => {
        this.setState({
          graphData : data.result,
          regionInfo: data.result[data.result.length - 1]
        })
      })
  }

  render() {
    return (
      <Layout>
        <Header><h1 style={{ color: "white" }}>COVID-19</h1></Header>
        <Layout>
          <Content
          >
            {/** Selection */}
            <Row
              gutter={[8, 8]}
              type="flex"
            >
              <Col span={4}

              >
                <Tabs type="card">
                  <TabPane
                    tab="Country"
                    key="Country"
                    style={{
                      overflow: 'auto',
                      position: 'relative',
                      height: "130vh"
                    }}
                  >
                    <Menu
                      mode="inline"
                      onClick={this.handleCountryOptionChange}

                    >
                      {
                        this.state.countries.map(c => {
                          return <Menu.Item key={c._id.country}>{c._id.country}</Menu.Item>
                        })
                      }
                    </Menu>
                  </TabPane>
                  <TabPane
                    disabled={!this.state.states.length}
                    tab="State"
                    key="State"
                    style={{
                      overflow: 'auto',
                      position: 'relative',
                      height: "130vh"
                    }}
                  >
                    <Menu
                      mode="inline"
                      onClick={this.handleStateOptionChange}
                    >
                      {
                        this.state.states.map(c => {
                          return <Menu.Item key={c._id.state}>{c._id.state}</Menu.Item>
                        })
                      }
                    </Menu>
                  </TabPane>
                  <TabPane
                    disabled={!this.state.counties.length}
                    tab="County"
                    key="County"
                    style={{
                      overflow: 'auto',
                      position: 'relative',
                      height: "130vh"
                    }}
                  >
                    <Menu
                      mode="inline"
                      onClick={this.handleCountyOptionChange}
                    >
                      {
                        this.state.counties.map(c => {
                          return <Menu.Item key={c._id.county}>{c._id.county}</Menu.Item>
                        })
                      }
                    </Menu>
                  </TabPane>
                </Tabs>
              </Col>

              {/** Content */}
              <Col span={14}>
                <Row gutter={[8, 8]}>
                  <Col key="Heatmap" span={24}>
                    <HeatMap
                      gis={this.state.gis}
                      lat={this.state.selected.map.lat}
                      lng={this.state.selected.map.lng}
                      zoom={this.state.selected.map.zoom}
                    />
                  </Col>
                </Row>
                <Row gutter={[8, 8]}>
                  <Col key="Selected-Country-Graph" span={24}>
                    <Graph
                      data={this.state.graphData}
                    />
                  </Col>
                </Row>
              </Col>


              <Col span={6}>
                <Row gutter={[8, 8]}>
                  <Col key="Country-Info" span={24}>
                    <CountryInfo
                      data={this.state.regionInfo}
                    />
                  </Col>
                </Row>
                <Row gutter={[8, 8]}>
                  <Col key="World-Info" span={24}>
                    <StatisticSummary
                      data={this.state.statistic} />
                  </Col>
                </Row>
              </Col>
            </Row>
          </Content>

        </Layout >
        <Footer style={{ textAlign: "center" }}>Data taken from MongoDB ©2020</Footer>
      </Layout >

    );
  }
}

export default App;
