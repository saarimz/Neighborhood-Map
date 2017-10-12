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
        self.tags = ko.observableArray(data.tags);

        //venue data
        self.rating = ko.observable(data.rating || 'N/A');
        self.likes = ko.observable(data.likes.count || 0);
        self.url = ko.observable(data.canonicalUrl);
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
                'rating': self.rating(),
                'likes' : self.likes(),
                'url' : self.url(),
                'price' : self.price()
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

        self.filterOptions = ko.observableArray(['All Results','8.0 or above','More than 100 likes','Verified by Owner','Poorly Rated']);
        self.currentFilter = ko.observable();

         //filter
         self.filteredList = ko.computed(function(){
            let filter = self.currentFilter();
            if (!filter) {
                return self.listItems();
            } else {
                return ko.utils.arrayFilter(self.listItems(),function(item){
                    switch (filter) {
                        case 'Verified by Owner':
                            if (item.getVerified()) {
                                item.marker.setMap(map);
                                return true;
                            } else {
                                item.marker.setMap(null);
                                return false;
                            }
                            break;
                        case '8.0 or above':
                            if (item.rating() >= 8.0) {
                                item.marker.setMap(map);
                                return true;
                            } else {
                                item.marker.setMap(null);
                                return false;
                            }
                            break;
                        case 'More than 100 likes':
                            if (item.likes() >= 100) {
                                item.marker.setMap(map);
                                return true;
                            } else {
                                item.marker.setMap(null);
                                return false;
                            }
                            break;
                        case 'Poorly Rated':
                            if (item.rating <= 6.0) {
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
        
        //foursquare search
        self.foursquareSearch = (url) => {
            fetch(url).then((response) => {
                return response.json();
            }).then((data) => {
                let currentSearch = self.itemToAdd();
                let venueDataPromises = [];
                self.clearList();
                self.itemToAdd(currentSearch);
                data.response.venues.forEach((venue) => {
                    //put request for venue information in an array
                    venueDataPromises.push(fetch(`https://api.foursquare.com/v2/venues/${venue.id}?v=20171006&client_secret=BYTSHE2RSR3PRO0EQASUDEMRJMIWBKQHT40XR30O4KHUHH4P&client_id=KF23DOLA3ZF03UHQCP5SNZBXFHQVLMIK1RV5S5XEMOUGWBXS`));
                });
                //execute after all promises have resolved
                Promise.all(venueDataPromises).then((response) => {
                    return Promise.all(response.map(val => val.json()));
                }).then((data) => {
                    //signal end of request for getting rid of spinener
                    self.requestHappening(false);
                    //create new bounds object for the request
                    let bounds = new google.maps.LatLngBounds();    
                    //simplify the response object              
                    let arr = data.map(val => val.response.venue);
                    //iterate through arr creating new objects and adding them to array
                    arr.forEach((venue) => {
                        //create venue obj
                        let venueObj = new ListData(venue);
                        //push to array
                        self.listItems.push(venueObj);
                        //extend the bounds
                        bounds.extend(venueObj.marker.position);
                    });
                    //update requestfailed observable
                    self.requestFailed(false); 
                    //fit map bounds
                    map.fitBounds(bounds);
                });
                self.currentFilter('All');
            
            }).catch((e) => {
                //end loading spinner
                self.requestHappening(false);
                //clear input field after search
                self.clearInputField();
                //update requestfailed observable
                self.requestFailed(true);
                //log error in console
                console.log(e);
            });    
        };
    };
    //ko apply bindings
    ko.applyBindings(new ViewModel());
});

