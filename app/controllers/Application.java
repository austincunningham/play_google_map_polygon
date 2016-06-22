package controllers;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import play.mvc.Controller;

public class Application extends Controller {

    public static void index() {
        render();
    }

    /**
     * Create list sample positional data
     * Necessary to add json-simple-1.1.jar or equivalent to lib folder
     * Then add jar to build path and import here
     */
    public static void listGeolocations()
    {
      List<List<String>> jsonArray = new ArrayList<List<String>>();
      jsonArray.add(0, Arrays.asList("Position 1", "44.008620", "-123.074341"));
      jsonArray.add(1, Arrays.asList("Position 2", "42.360082", "-71.058880"));
      jsonArray.add(2, Arrays.asList("Position 3", "31.360082", "-91.058880"));
      renderJSON(jsonArray);
    }

}