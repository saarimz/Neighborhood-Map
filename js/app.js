//wrap in jquery function to let doc load
$(document).ready(function(){
    
    //model object
    let ListData = function(data){
        //save reference to the object
        let self = this;

        //data
        self.id = ko.observable(data.id);
        self.name = ko.observable(data.name);
        self.lat = ko.observable(data.location.lat);
        self.lng = ko.observable(data.location.lng);
        self.address = ko.observable(data.location.address || (data.location.formattedAddress || 'No Address Found'));
        self.coords = ko.computed(() => {
            return {lat: self.lat(), lng: self.lng()}
        });
        self.verified = ko.observable(data.verified);

        //venue data
        //console.log(self.rating);
        self.rating = ko.observable(data.rating);
        self.likes = ko.observable(data.likes);
        self.url = ko.observable(data.url);
        self.price = ko.observable(data.price);

        //map data
        self.marker = new google.maps.Marker({
            position: {lat: self.lat(), lng: self.lng()},
            title: self.name(),
            animation: google.maps.Animation.DROP,
            icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
        });

        //set the template
        self.infoWindowTemplate = _.template($("#infoWindowTemplate").html());

        //create infowindow with the template
        self.infoWindow = new google.maps.InfoWindow({
            content: self.infoWindowTemplate({
                'name': self.name(),
                'address': self.address(),
                'rating': self.rating()
            })
        });

        //show infowindow on click
        self.marker.addListener('click', () => {
            self.infoWindow.open(map, self.marker);
        });

        //add, remove marker
        self.removeMarker = () => {
            self.marker.setMap(null);
        }
        
        self.addMarker = () => {
            self.marker.setMap(map);
        }

        //utility functions
        self.getMarker = () => {
            return self.marker;
        };

        self.getInfoWindow = () =>{
            return self.infoWindow;
        };

        self.getVerified = () => {
            return self.verified();
        };

        //highlight marker + open infowindow on hover
        self.highlightMarker = () => {
            self.infoWindow.open(map, self.marker);
            self.marker.setIcon('http://maps.google.com/mapfiles/ms/icons/yellow-dot.png');
            self.marker.setAnimation(google.maps.Animation.BOUNCE);
        };

        self.unhighlightMarker = () => {
            self.infoWindow.close();
            self.marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
            self.marker.setAnimation(null);
        };
    }

    //VM
    let ViewModel = function() {
        let self = this;

        //list of results
        self.listItems = ko.observableArray([]);
        
        //input field
        self.itemToAdd = ko.observable("");

        //search limit bar
        self.searchLimit = ko.observableArray([10,20,30,40,50]);
        self.limitValue = ko.observable();

        //api request
        self.requestHappening = ko.observable(false);
        self.requestFailed = ko.observable(false);

        //search category
        self.searchCategories = ko.observableArray(['Food','Drink','Fun','Shop']);
        self.categoryValue = ko.observable();

        self.filterOptions = ko.observableArray(['All','Verified','Unverified'])
        self.currentFilter = ko.observable();

         //filter
         self.filteredList = ko.computed(function(){
            let filter = self.currentFilter();
            if (!filter) {
                return self.listItems();
            } else {
                return ko.utils.arrayFilter(self.listItems(),function(item){
                    switch (filter) {
                        case 'Verified':
                            if (item.getVerified()) {
                                item.marker.setMap(map);
                                return true;
                            } else {
                                item.marker.setMap(null);
                                return false;
                            }
                            break;
                        case 'Unverified':
                            if (!item.getVerified()) {
                                item.marker.setMap(map);
                                return true;
                            } else {
                                item.marker.setMap(null);
                                return false;
                            }
                            break;
                        default:
                            item.marker.setMap(map);
                            return true;
                    }
                });
            }
        },self);

        self.getCategoryID = (category) => {
            switch (category) {
                case 'Food':
                    return '4d4b7105d754a06374d81259';
                    break;
                case 'Drink':
                    return '4d4b7105d754a06376d81259';
                    break;
                case 'Fun':
                    return '4d4b7105d754a06377d81259';
                    break;
                case 'Shop':
                    return '4d4b7105d754a06378d81259';
                    break;
                default:
                    return null;
            }
        };

        //search bar search
        self.search = () => {
            let search = self.itemToAdd();
            let limit = self.limitValue();
            let category = self.getCategoryID(self.categoryValue());
            let radius = 1000;
            let intent = 'checkin';
            let url = `https://api.foursquare.com/v2/venues/search?v=20171006&client_secret=BYTSHE2RSR3PRO0EQASUDEMRJMIWBKQHT40XR30O4KHUHH4P&client_id=KF23DOLA3ZF03UHQCP5SNZBXFHQVLMIK1RV5S5XEMOUGWBXS&near=${search}&intent=${intent}&categoryId=${category}&radius=${radius}&limit=${limit}`;
             //start spinner 
            self.requestHappening(true);
            self.foursquareSearch(url);
        };

        self.clearInputField = () => {
            self.itemToAdd(null);
        };

        self.clearList = () => {
            //remvoe markers
            self.listItems().forEach((item) =>{
                item.marker.setMap(null);
            });
            //clear input field 
            self.clearInputField();
            //remove item from list
            self.listItems.removeAll();
        };

        self.hasItem = ko.computed(() => {
            return (self.itemToAdd());
        });

        self.isNotEmpty = ko.computed(() => {
            return (self.listItems().length);
        });


        self.removeItem = (item) => {
            //marker
            item.marker.setMap(null);
            //item
            self.listItems.remove(item);
        };

        self.currentLocationSearch = () => {
            self.requestHappening(true);
            navigator.geolocation.getCurrentPosition(function(position){
                //get query params
                let ll = `${position.coords.latitude},${position.coords.longitude}`
                let limit = self.limitValue();
                let radius = 250;
                let category = self.getCategoryID(self.categoryValue());
                let intent = 'browse'
                //query
                let url = `https://api.foursquare.com/v2/venues/search?v=20171006&client_secret=BYTSHE2RSR3PRO0EQASUDEMRJMIWBKQHT40XR30O4KHUHH4P&client_id=KF23DOLA3ZF03UHQCP5SNZBXFHQVLMIK1RV5S5XEMOUGWBXS&ll=${ll}&intent=${intent}&categoryId=${category}&radius=${radius}&limit=${limit}`;
                //call search function
                self.foursquareSearch(url);
            });
        };

        self.foursquareSearch = (url) => {
            fetch(url).then((response) => {
                return response.json();
            }).then((data) => {
                let bounds = new google.maps.LatLngBounds();
                let currentSearch = self.itemToAdd();
                let venueDataPromises = [];
                let venues = []
                self.clearList();
                self.itemToAdd(currentSearch);
                data.response.venues.forEach((venue) => {
                    //signal end of request for getting rid of spinener
                    self.requestHappening(false);
                    //TO DOdo request for additional venue details
                    venues.push(venue);
                    venueDataPromises.push(fetch(`https://api.foursquare.com/v2/venues/${venue.id}?v=20171006&client_secret=BYTSHE2RSR3PRO0EQASUDEMRJMIWBKQHT40XR30O4KHUHH4P&client_id=KF23DOLA3ZF03UHQCP5SNZBXFHQVLMIK1RV5S5XEMOUGWBXS`));
                    /*
                    //create venue obj
                    let venueObj = new ListData(venue);
                    //push to array
                    self.listItems.push(venueObj);
                    //extend the bounds
                    bounds.extend(venueObj.marker.position);
                    //update requestfailed observable
                    self.requestFailed(false); */
                });
                Promise.all(venueDataPromises).then((response) => {
                    return Promise.all(response.map(val => val.json()));
                }).then((data) => {
                    let arr = data.map(val => val.response.venue);
                    console.log(venues[0]);
                    console.log(arr[0]);
                    //next step is to combine these two arrays into one object (or use the final promise result /venue to create listings)
                });
                self.currentFilter('All');
                map.fitBounds(bounds);
            
            }).catch((e) => {
                //end loading spinner
                self.requestHappening(false);
                //clear input field after search
                self.clearInputField();
                //update requestfailed observable
                self.requestFailed(true);
                //log in console
                console.log(e);
            });
            
            /*.then((resultArr) => {
                for (item of resultArr) {
                    let venueID = item.id();
                    //console.log(item.id());
                    let responseObj = self.getVenueData(venueID);
                    item.likes(responseObj.likes);
                    item.price(responseObj.price);
                    item.rating(responseObj.rating);
                    item.url(responseObj.url);
                }
            }).catch((e) => {
                console.log(e);
                console.log("Error making venuedata request")
            })*/
        };
        /*
        self.getVenueData = (bounds,venue,id) => {
            let url = `https://api.foursquare.com/v2/venues/${id}?v=20171006&client_secret=BYTSHE2RSR3PRO0EQASUDEMRJMIWBKQHT40XR30O4KHUHH4P&client_id=KF23DOLA3ZF03UHQCP5SNZBXFHQVLMIK1RV5S5XEMOUGWBXS`;
            let resultObj = {};
            fetch(url).then((response) => {
                return response.json();
            }).then((data) => {
                let responseData = data.response.venue
                resultObj.likes = responseData.likes.count;
                resultObj.rating = responseData.rating;
                resultObj.price = responseData.price.tier;
                resultObj.url = responseData.shortUrl;
                return resultObj;
            }).catch((e) => {
                console.log(e);
                console.log("Error getting venue data");
            }).then((result) => {
                //add the additional keys to venue
                venue.likes = result.likes || '';
                venue.price = result.price || '';
                venue.url = result.url || '';
                venue.rating = result.rating || '';
                //create venue obj
                let venueObj = new ListData(venue);
                //push to array
                self.listItems.push(venueObj);
                //extend the bounds
                bounds.extend(venueObj.marker.position);
                //update requestfailed observable
                self.requestFailed(false);
            });
        };*/

    } 

    //ko apply bindings
    ko.applyBindings(new ViewModel());
});

