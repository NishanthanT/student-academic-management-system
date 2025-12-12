package stepdefinition.Adminpage;

import Utility.BrowserDriver;
import io.cucumber.java.PendingException;
import io.cucumber.java.en.Given;

import static Pages.Adminpage.Adminlogin.*;

public class Adminlogin  {
    @Given("Admin navigate to the login page")
    public void adminNavigateToTheLoginPage() throws InterruptedException {
        naviagtetoAdminLoginPageURL();
        clickdemoaccountbutton();
        clicksignbutton();
    }
}
