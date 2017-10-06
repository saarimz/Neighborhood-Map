$(document).ready(function(){
    
    //model object
    let ListData = function(data){
        let self = this;
        self.id = ko.observable(data.id);
        self.name = ko.observable(data.name);
        self.lat = ko.observable(data.location.lat);
        self.lng = ko.observable(data.location.lng);
        self.address = ko.observable(data.location.address || data.location.formattedAddress);
        self.coords = ko.computed(function(){
            return {lat: self.lat, lng: self.lng};
        })
    }

    //VM
    let ViewModel = function() {
        let self = this;

        self.listItems = ko.observableArray([]);

        self.itemToAdd = ko.observable("");

        self.search = function(){
            let search = self.itemToAdd();
            let url = `https://api.foursquare.com/v2/venues/search?v=20171006&client_secret=BYTSHE2RSR3PRO0EQASUDEMRJMIWBKQHT40XR30O4KHUHH4P&client_id=KF23DOLA3ZF03UHQCP5SNZBXFHQVLMIK1RV5S5XEMOUGWBXS&limit=10&near=${search}`
            fetch(url).then(function(response){
                return response.json();
            }).then(function(data){
                data.response.venues.forEach(function(venue){
                    let venueObj = new ListData(venue)
                    self.listItems.push(venueObj);
                });
            }).catch(function(){
                console.log("Error fetching request");
            });
        }

        self.clearList = function() {
            self.listItems.removeAll();
        }

        self.hasItem = ko.computed(function(){
            return (self.itemToAdd());
        });

        self.isNotEmpty = ko.computed(function(){
            return (self.listItems().length);
        })

        self.removeItem = function(item){
            self.listItems.remove(item);
        }

        
    } 

    //ko apply bindings
    ko.applyBindings(new ViewModel());
    let map;

    function initMap(){
        map = new google.maps.Map(document.getElementById("map"),{
            center: {lat: 40.7134, lng: -74.0055},
            zoom: 12
        });
    }
});

