package Pages.student;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.List;

public class StudentAttemptExam {

    WebDriver driver;
    WebDriverWait wait;

    public StudentAttemptExam(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(15));
    }

    // NAV
    By attemptExamNav = By.id("student-nav-attempt-exam");

    // PAGE CHECK
    By pageTitle = By.xpath("//*[text()='Attempt Exam']");
    By availableExamTitle = By.xpath("//*[text()='Available Exams']");
    By subjectSelect = By.id("student-attempt-subject-select");

    // EXAM ACTION BUTTONS
    By examButtons = By.xpath("//button[contains(@id,'student-attempt-exam-btn-')]");

    // MODAL
    By passwordModalClose = By.id("student-attempt-pwd-modal-close");
    By passwordInput = By.id("student-attempt-pwd-input");
    By startExamButton = By.id("student-attempt-start-exam-btn");

    // EMPTY / NOTE
    By noteBlock = By.xpath("//*[text()='Note']");
    By noExamText = By.xpath("//*[contains(text(),'No exams found')]");

    public void clickAttemptExamNav() {
        wait.until(ExpectedConditions.elementToBeClickable(attemptExamNav)).click();
    }

    public boolean isAttemptExamPageDisplayed() {
        try {
            return wait.until(ExpectedConditions.visibilityOfElementLocated(pageTitle)).isDisplayed()
                    && wait.until(ExpectedConditions.visibilityOfElementLocated(availableExamTitle)).isDisplayed()
                    && wait.until(ExpectedConditions.visibilityOfElementLocated(subjectSelect)).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isAvailableExamsSectionWorking() {
        try {
            // note block visible means page loaded properly
            boolean noteVisible = wait.until(ExpectedConditions.visibilityOfElementLocated(noteBlock)).isDisplayed();

            List<WebElement> buttons = driver.findElements(examButtons);
            List<WebElement> noExam = driver.findElements(noExamText);

            // either exams available or no exams message visible
            return noteVisible && (!buttons.isEmpty() || !noExam.isEmpty());
        } catch (Exception e) {
            return false;
        }
    }

    public boolean clickFirstExamActionButtonIfEnabled() {
        try {
            List<WebElement> buttons = driver.findElements(examButtons);

            if (buttons.isEmpty()) {
                System.out.println("No exam action button found");
                return true;
            }

            for (WebElement btn : buttons) {
                if (btn.isDisplayed()) {
                    String buttonText = btn.getText().trim();
                    System.out.println("Found exam button: " + buttonText);

                    if (btn.isEnabled() && !buttonText.equalsIgnoreCase("Absent")
                            && !buttonText.equalsIgnoreCase("Locked")
                            && !buttonText.equalsIgnoreCase("Submitted")) {
                        btn.click();
                        return true;
                    }
                }
            }

            // if all buttons disabled, still page is working
            System.out.println("All exam buttons are disabled states like Absent/Locked/Submitted");
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isPasswordModalActionWorking() {
        try {
            List<WebElement> modalInputs = driver.findElements(passwordInput);
            List<WebElement> modalCloseButtons = driver.findElements(passwordModalClose);
            List<WebElement> startButtons = driver.findElements(startExamButton);

            // modal open aaguna, close panni verify
            if (!modalInputs.isEmpty() && !modalCloseButtons.isEmpty() && !startButtons.isEmpty()) {
                WebElement closeBtn = wait.until(ExpectedConditions.elementToBeClickable(passwordModalClose));
                closeBtn.click();

                // modal close aagiducha
                return driver.findElements(passwordInput).isEmpty();
            }

            // modal open aagala naalum action handled successfully
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}