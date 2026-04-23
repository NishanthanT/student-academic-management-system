package stepdefinition.Adminpage;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.Assert;

import static Pages.Adminpage.Settings.*;

public class Settings {

    @Given("Admin clicks settings navigation button")
    public void adminClicksSettingsNavigationButton() throws InterruptedException {
        clickSettingsNavigationButton();
    }

    @When("Admin updates system name")
    public void adminUpdatesSystemName() throws InterruptedException {
        updateSystemName();
    }

    @When("Admin uploads system logo")
    public void adminUploadsSystemLogo() throws InterruptedException {
        uploadSystemLogo();
    }

    @When("Admin clicks temporary slider toggle")
    public void adminClicksTemporarySliderToggle() throws InterruptedException {
        clickTemporarySliderToggle();
    }

    @When("Admin clicks save settings button")
    public void adminClicksSaveSettingsButton() throws InterruptedException {
        clickSaveSettingsButton();
    }

    @Then("Settings should be saved successfully")
    public void settingsShouldBeSavedSuccessfully() {
        Assert.assertTrue("Settings were not saved successfully", isSettingsSavedSuccessfully());
        System.out.println("Settings saved successfully");
    }
}