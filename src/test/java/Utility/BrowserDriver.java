package Utility;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import io.github.bonigarcia.wdm.WebDriverManager;

public class BrowserDriver {

    public static WebDriver driver;

    public static void BrowserDriver() {


        WebDriverManager.chromedriver().clearDriverCache().setup(); // clean + auto download

        driver = new ChromeDriver();
    }
}
