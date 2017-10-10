$(document).ready(function(){
    
    //model object
    let ListData = function(data){
        let self = this;
        self.id = ko.observable(data.id);
        self.name = ko.observable(data.name);
        self.lat = ko.observable(data.location.lat);
        self.lng = ko.observable(data.location.lng);
        self.address = ko.observable(data.location.address || data.location.formattedAddress);
        self.coords = ko.computed(() => {
            return {lat: self.lat(), lng: self.lng()}
        });

        self.marker = new google.maps.Marker({
            position: {lat: self.lat(), lng: self.lng()},
            title: self.name(),
            map: map,
            animation: google.maps.Animation.DROP
        });
    }

    //VM
    let ViewModel = function() {
        let self = this;

        self.listItems = ko.observableArray([]);

        self.itemToAdd = ko.observable("");

        //search limit bar
        self.searchLimit = ko.observableArray([10,20,30,40,50,100]);
        self.limitValue = ko.observable();

<<<<<<< HEAD
        //to do: add a dropdown for category
=======
        //api request
        self.requestHappening = ko.observable(false);
        self.requestFailed = ko.observable(false);
>>>>>>> ec9b63881befbf4c1c6626454225b80b5c5006e2

        self.search = () => {
            let search = self.itemToAdd();
            let limit = self.limitValue();
            let url = `https://api.foursquare.com/v2/venues/search?v=20171006&client_secret=BYTSHE2RSR3PRO0EQASUDEMRJMIWBKQHT40XR30O4KHUHH4P&client_id=KF23DOLA3ZF03UHQCP5SNZBXFHQVLMIK1RV5S5XEMOUGWBXS&limit=${limit}&near=${search}`;
            self.foursquareSearch(url);
        }

        self.clearList = () => {
            //remvoe markers
            self.listItems().forEach((item) =>{
                item.marker.setMap(null);
            });

            //remove item from list
            self.listItems.removeAll();
        }

        self.hasItem = ko.computed(() => {
            return (self.itemToAdd());
        });

        self.isNotEmpty = ko.computed(() => {
            return (self.listItems().length);
        })

        self.removeItem = (item) => {
            //marker
            item.marker.setMap(null);
            //item
            self.listItems.remove(item);
            
        }

        self.currentLocationSearch = () => {
            navigator.geolocation.getCurrentPosition(function(position){
                let ll = `${position.coords.latitude},${position.coords.longitude}`
                let limit = self.limitValue();
                let url = `https://api.foursquare.com/v2/venues/search?v=20171006&client_secret=BYTSHE2RSR3PRO0EQASUDEMRJMIWBKQHT40XR30O4KHUHH4P&client_id=KF23DOLA3ZF03UHQCP5SNZBXFHQVLMIK1RV5S5XEMOUGWBXS&limit=${limit}&ll=${ll}`;
                self.foursquareSearch(url);
            });
        }

        self.foursquareSearch = (url) => {
<<<<<<< HEAD
            //TO DO: convert this to Knockout
            $(".fa-spinner").toggleClass("hidden");

=======
            self.requestHappening(true);
>>>>>>> ec9b63881befbf4c1c6626454225b80b5c5006e2
            fetch(url).then((response) => {
                return response.json();
            }).then((data) => {
                let bounds = new google.maps.LatLngBounds();
                self.clearList();
                data.response.venues.forEach((venue) => {
                    self.requestHappening(false);
                    let venueObj = new ListData(venue)
                    self.listItems.push(venueObj);
                    bounds.extend(venueObj.marker.position);
                    //clear item after search
                    self.itemToAdd(null);
                    self.requestFailed(false);
                });
<<<<<<< HEAD
                //TO DO: convert this to Knockout
                $(".fa-spinner").toggleClass("hidden");

                map.fitBounds(bounds);
            }).catch((e) =>{
                //TO DO: convert this to Knockout
                $(".fa-spinner").toggleClass("hidden");
                $(".list-view").html("<li>Not Found</li>");

=======
                map.fitBounds(bounds);
            }).catch((e) => {
                self.requestHappening(false);
                self.requestFailed(true);
>>>>>>> ec9b63881befbf4c1c6626454225b80b5c5006e2
                console.log(e);
            });
            
        }
    } 

    //ko apply bindings
    ko.applyBindings(new ViewModel());

});

