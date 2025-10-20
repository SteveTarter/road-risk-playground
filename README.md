# Road Risk Playground

This repository contains the code to implement and deploy a web application that lets a user assess the relative accident risk for a route chosen on a map.

## Background
This project responds to the Kaggle Playground competition, [Predicting Road Accident Risk](https://www.kaggle.com/competitions/playground-series-s5e10/overview), and its companion [Stack Overflow Challenge](https://stackoverflow.com/beta/challenges/79780240/kaggle-stack-overflow-two-part-challenge), which adds development and deployment of an application that uses the model interactively.

## Front End
The front end is a React application with a Mapbox component that allows the user to select start and end points by clicking on the map. Alternatively, the points can be specified by address. The points are sent to the back end when the user confirms the selection. After processing, the back end returns the generated route, the list of variables sent to the model, and the accident-risk assessment.

## Back End
The route is analyzed to extract variables needed for the model to predict accident risk: road curvature, number of lanes, and road type (street, highway, primary, etc.). Route location and time of day are used to determine sunrise and sunset times to derive lighting conditions. The National Weather Service is queried for current weather. Once all variables are derived, they are passed to the model and the results are returned to the front end for display.

## Infrastructure
A Terraform project describes deployment of the application to AWS
