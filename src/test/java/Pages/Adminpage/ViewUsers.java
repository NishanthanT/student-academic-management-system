package Pages.Adminpage;

import Utility.BrowserDriver;
import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.List;

public class ViewUsers extends BrowserDriver {

    public static String updatedUserName = "Edited Automation User";

    public static WebElement waitForVisible(By locator) {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    public static WebElement waitForClickable(By locator) {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        return wait.until(ExpectedConditions.elementToBeClickable(locator));
    }

    public static void clickViewUsersNavigationButton() throws InterruptedException {
        waitForClickable(By.id("admin-nav-view-users")).click();
        Thread.sleep(2000);
        waitForVisible(By.id("vu-tab-all"));
    }

    public static void clickAllUsersTab() throws InterruptedException {
        waitForClickable(By.id("vu-tab-all")).click();
        Thread.sleep(1500);
    }

    public static String getFirstRowUserId() {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("tbody tr")));
        List<WebElement> editButtons = driver.findElements(By.cssSelector("button[id^='vu-edit-']"));
        String fullId = editButtons.get(0).getAttribute("id"); // vu-edit-48
        return fullId.replace("vu-edit-", "");
    }

    public static void clickFirstRowEditButton() throws InterruptedException {
        String userId = getFirstRowUserId();
        waitForClickable(By.id("vu-edit-" + userId)).click();
        Thread.sleep(1500);
        waitForVisible(By.id("vu-edit-modal"));
    }

    public static void clearInput(WebElement element) throws InterruptedException {
        element.click();
        element.sendKeys(Keys.chord(Keys.CONTROL, "a"));
        element.sendKeys(Keys.BACK_SPACE);
        Thread.sleep(500);
    }

    public static void changeFirstRowUserNameAndSave() throws InterruptedException {
        WebElement nameInput = waitForVisible(By.id("vu-edit-name"));
        clearInput(nameInput);
        nameInput.sendKeys(updatedUserName);

        waitForClickable(By.id("vu-edit-save")).click();
        Thread.sleep(2500);
    }

    public static String getToastMessage() {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        WebElement toast = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.xpath("//div[contains(@class,'fixed top-10 right-10')]")
                )
        );
        return toast.getText().trim();
    }

    public static void clickFirstRowDeleteButton() throws InterruptedException {
        String userId = getFirstRowUserId();
        waitForClickable(By.id("vu-del-" + userId)).click();
        Thread.sleep(1500);
        waitForVisible(By.id("vu-delete-modal"));
    }

    public static boolean isDeleteConfirmButtonDisabled() {
        WebElement deleteConfirmButton = waitForVisible(By.id("vu-del-confirm"));
        return !deleteConfirmButton.isEnabled();
    }

    public static void enterDeleteReasonAndConfirmDelete() throws InterruptedException {
        WebElement reasonBox = waitForVisible(By.id("vu-delete-reason"));
        clearInput(reasonBox);
        reasonBox.sendKeys("Automation delete test");

        Thread.sleep(1000);
        waitForClickable(By.id("vu-del-confirm")).click();
        Thread.sleep(2500);
    }

    public static void clickAllUsersFilter() throws InterruptedException {
        waitForClickable(By.id("vu-tab-all")).click();
        Thread.sleep(1200);
    }

    public static void clickAdminsFilter() throws InterruptedException {
        waitForClickable(By.id("vu-tab-admin")).click();
        Thread.sleep(1200);
    }

    public static void clickStaffFilter() throws InterruptedException {
        waitForClickable(By.id("vu-tab-staff")).click();
        Thread.sleep(1200);
    }

    public static void clickStudentsFilter() throws InterruptedException {
        waitForClickable(By.id("vu-tab-student")).click();
        Thread.sleep(1200);
    }
}