import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import axios from 'axios';
import './App.css';

const Home = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] === useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/companies');
        setCompanies(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching companies:', error);
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  if (loading) return <div className="text-center p-4">Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Companies</h1>
      <ul className="list-disc pl-5">
        {companies.map((company) => (
          <li key={company.id} className="my-2">{company.name}</li>
        ))}
      </ul>
    </div>
  );
};

const CompanyDetail = ({ match }) => {
  const [shareholders, setShareholders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShareholders = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/shareholders/${match.params.id}`);
        setShareholders(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching shareholders:', error);
        setLoading(false);
      }
    };
    fetchShareholders();
  }, [match.params.id]);

  if (loading) return <div className="text-center p-4">Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Shareholders</h1>
      <ul className="list-disc pl-5">
        {shareholders.map((shareholder) => (
          <li key={shareholder.id} className="my-2">{shareholder.name} - {shareholder.email}</li>
        ))}
      </ul>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <div className="App">
        <Switch>
          <Route exact path="/" component={Home} />
          <Route path="/company/:id" component={CompanyDetail} />
        </Switch>
      </div>
    </Router>
  );
};

export default App;
