import React, { useEffect, useState, PureComponent } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import Friend from "./../components/Friend.js";
import Friendrequest from "./../components/Friendrequest.js";
import Navbar from "./../components/homecomponents/Navbar.js";
import "./../css/profile.css";
import { useParams } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart, Pie
} from "recharts";


const Profile = () => {
  const { user } = useAuth0();
  const [FriendsData, setFriendsData] = useState(null);
  const [matchesData, setMatchesData] = useState(null);
  const [GraphData, setGraphData] = useState([]);
  const [PieData,setPieData]=useState([]);
  //including pie chart sepcific data---------------------------------------------------------------

  useEffect(() => {
    if (user != undefined || user != null) {
      // console.log(user);
      async function findallmatchdata() {
        const res = await fetch("http://localhost:5000/findmatchdata", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ emailid: user.email }),
        });
        const data = await res.json();
        const finalData = data.data[0];
        var arr = [];
        var piearr=[
          {name:"Total Matches",value:finalData.totalMatch},
          {name:"First Position",value:finalData.first},
          {name:"Second Position",value:finalData.second},
          {name:"Third Position",value:finalData.third},
          {name:"Losses",value:finalData.totalMatch-finalData.first-finalData.second-finalData.third}
        ];
        setPieData(piearr);
        if (finalData != null && finalData.pastmatches != null) {
          await finalData.pastmatches?.map((element, index) => {
            arr = [
              ...arr,
              {
                name: "Match " + (index + 1),
                rating_gained: element.add,
                points_earned: element.points,
              },
            ];
            
          });
          setGraphData(arr);
        }

        // console.log(arr);

        setMatchesData(data.data[0]);
        // console.log(data.data[0]);
      }
      findallmatchdata();
    }
  }, [user]);

  useEffect(() => {
    if (user != undefined || user != null) {
      // console.log(user);
      async function findallfriendsdata() {
        const res = await fetch("http://localhost:5000/findfriends", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ emailid: user.email }),
        });
        const data = await res.json();
        setFriendsData(data.data[0]);
        console.log(data.data[0]);
      }
      findallfriendsdata();
    }
  }, [user]);

  // console.log("data:"+friendsdata);

  return (
    <>
      <Navbar />
      <div className="profile_monitor">
        <div className="profile_outerdiv">
          <div className="friends_list_div">
            <div>
              <h3>Your Friends:</h3>
              <div id="f_scroll" className="friends_scroll">
                {FriendsData?.friends.map((element) => {
                  return <Friend name={element.name} email={element.email} />;
                })}

                {/* <Friend name="sarthak patel" /> */}
              </div>
            </div>
            <div>
              <h3>Friend Requests:</h3>
              <div id="f_scroll" className="friends_scroll">
                {FriendsData?.friends.map((element) => {
                  return (
                    <Friendrequest name={element.name} email={element.email} />
                  );
                })}
                {/* <Friendrequest name="sarthak patel" />
                <Friendrequest name="sarthak patel" /> */}
              </div>
            </div>
          </div>

          <div className="stats_div">
            <div className="summary_stats">
              <div className="stat_box">
                <h2>Toatal Matches</h2>
                <h2>{matchesData?.totalMatch}</h2>
              </div>
              <div className="stat_box">
                <h2>Toatal Points</h2>
                <h2>{matchesData?.totalpoints}</h2>
              </div>
              <div className="stat_box">
                <h2>Level</h2>
                <h2>{matchesData?.level}</h2>
              </div>
            </div>
            <div className="graph_div">
              <div className="line_chart">
                <LineChart
                  width={600}
                  height={400}
                  data={GraphData}
                  margin={{
                    top: 40,
                    right: 60,
                    left: 0,
                    bottom: 40,
                  }}
                  padding={{
                    top: 10,
                    right: 10,
                    left: 10,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid strokeDasharray="0 0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="points_earned"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rating_gained"
                    stroke="hsl(179, 93%, 44%)"
                  />
                </LineChart>
              </div>
              <div className="pie_chart">
                <PieChart width={400} height={400}>
                  <Pie
                    dataKey="value"
                    isAnimationActive={true}
                    data={PieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="hsl(179, 93%, 44%)"
                    label="Matches Played Stats"
                  />
                  <Tooltip />
                </PieChart>
              </div>
            </div>

            <div className="past_matches_div">
              <h1>hello</h1>
              <h1>hello</h1>
              <h1>hello</h1>
              <h1>hello</h1>
              <h1>hello</h1>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default React.memo(Profile);
